variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ai-notes"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into EC2"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type (t2.micro for Free Tier)"
  type        = string
  default     = "t2.micro"
}

variable "ec2_key_name" {
  description = "Name of the EC2 key pair for SSH"
  type        = string
}

variable "rds_instance_class" {
  description = "RDS instance class (db.t2.micro for Free Tier)"
  type        = string
  default     = "db.t2.micro"
}

variable "skip_final_snapshot" {
  description = "Skip final RDS snapshot on destroy (set false for production)"
  type        = bool
  default     = true
}
