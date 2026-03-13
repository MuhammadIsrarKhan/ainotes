terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# -----------------------------------------------------------------------------
# VPC and subnets (minimal for Free Tier: 1 public for EC2, 1 private for RDS)
# -----------------------------------------------------------------------------
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.project_name}-public"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = {
    Name = "${var.project_name}-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3)
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = {
    Name = "${var.project_name}-private-b"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = [
    aws_subnet.private.id,
    aws_subnet.private_b.id,
  ]
  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

# -----------------------------------------------------------------------------
# Security groups
# -----------------------------------------------------------------------------
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  description = "EC2: SSH, HTTP, HTTPS"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH"
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "RDS PostgreSQL: allow EC2 only"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "PostgreSQL from EC2"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL (Free Tier: db.t2.micro)
# -----------------------------------------------------------------------------
resource "random_password" "db" {
  length  = 24
  special = false
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.rds_instance_class
  allocated_storage     = 20
  max_allocated_storage = 0
  storage_type          = "gp2"
  db_name  = "ainotes"
  username = "ainotes"
  password = random_password.db.result
  port     = 5432
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible   = false
  skip_final_snapshot    = var.skip_final_snapshot
  backup_retention_period = 0
  tags = {
    Name = "${var.project_name}-rds"
  }
}

# -----------------------------------------------------------------------------
# EC2 (Free Tier: t2.micro)
# -----------------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_name
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  root_block_device {
    volume_size = 30
    volume_type = "gp2"
  }
  user_data = templatefile("${path.module}/user-data.sh", {
    project_name = var.project_name
  })
  tags = {
    Name = "${var.project_name}-app"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags = {
    Name = "${var.project_name}-eip"
  }
}
