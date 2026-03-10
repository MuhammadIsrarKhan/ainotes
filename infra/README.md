# AI Notes – Terraform (AWS Free Tier)

Provisions VPC, EC2 (t2.micro), RDS PostgreSQL (db.t2.micro), and security groups.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- AWS CLI configured (`aws configure`) or env vars `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- An EC2 key pair in the target region (create in EC2 → Key Pairs)

## Usage

1. Create `terraform.tfvars` (or pass variables on the CLI):

```hcl
aws_region   = "us-east-1"
project_name = "ai-notes"
ec2_key_name = "your-key-pair-name"
ssh_cidr_blocks = ["YOUR_IP/32"]  # Restrict SSH to your IP
```

2. Apply:

```bash
terraform init
terraform plan
terraform apply
```

3. After apply, get outputs:

```bash
terraform output ec2_public_ip
terraform output -raw db_password    # Use for DATABASE_URL
terraform output rds_endpoint
```

Build `DATABASE_URL` as:
`postgresql://ainotes:<db_password>@<rds_endpoint>/ainotes?schema=public`

4. SSH and deploy the app (see repo root `deploy/` and `docs/DEPLOYMENT.md`):

```bash
ssh -i your-key.pem ubuntu@$(terraform output -raw ec2_public_ip)
```

## Free Tier

- EC2 t2.micro: 750 h/month (12 months)
- RDS db.t2.micro: 750 h/month + 20 GB (12 months)
- EBS 30 GB for EC2 root

## Destroy

```bash
terraform destroy
```

Set `skip_final_snapshot = false` in variables if you want a final RDS snapshot before destroy.
