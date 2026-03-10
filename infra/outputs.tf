output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_eip.app.public_ip
}

output "ec2_ssh" {
  description = "SSH command to connect to EC2"
  value       = "ssh -i <your-key.pem> ubuntu@${aws_eip.app.public_ip}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint (use for DATABASE_URL)"
  value       = aws_db_instance.main.endpoint
}

output "database_url" {
  description = "PostgreSQL connection string (password is in Terraform state / random_password.db)"
  value       = "postgresql://${aws_db_instance.main.username}:<PASSWORD>@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}?schema=public"
  sensitive   = true
}

output "db_password" {
  description = "RDS master password (sensitive)"
  value       = random_password.db.result
  sensitive   = true
}
