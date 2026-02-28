# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ainotes?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# Hugging Face
HF_TOKEN=your-hugging-face-token
HF_TEXT_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Application
PORT=3000
NODE_ENV=development
```

## Getting a Hugging Face Token

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Navigate to [Settings > Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "Read" permissions
5. Copy the token and paste it as `HF_TOKEN` in your `.env` file

## Notes

- The `DATABASE_URL` should match the credentials in `docker-compose.yml`
- Change `JWT_SECRET` to a strong random string in production (use `openssl rand -base64 32`)
- The `HF_TEXT_MODEL` can be changed to any compatible text generation model from Hugging Face

