# AI Notes Backend

A production-ready NestJS API for managing notes with AI-powered features (summarization and tag generation) using Hugging Face models.

## Tech Stack

- **Node.js** (LTS) + **TypeScript**
- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **Hugging Face Inference** - AI model integration
- **JWT** - Authentication
- **Swagger** - API documentation
- **Docker** - PostgreSQL containerization

## Features

- 🔐 JWT-based authentication (register/login)
- 📝 Notes CRUD operations with ownership checks
- 🔍 Search and pagination for notes
- 🤖 AI-powered note summarization
- 🏷️ AI-powered tag generation
- 📊 AI request audit logging
- 📚 Swagger API documentation
- ✅ Input validation with DTOs
- 🛡️ Security best practices

## Prerequisites

- Node.js (LTS version, 18+ recommended)
- Docker and Docker Compose
- npm or yarn
- Hugging Face account and API token ([Get one here](https://huggingface.co/settings/tokens))

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

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

**Important:** 
- Replace `HF_TOKEN` with your actual Hugging Face API token
- Change `JWT_SECRET` to a strong random string in production
- The `HF_TEXT_MODEL` can be changed to any compatible text generation model

### 3. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432. Verify it's running:

```bash
docker-compose ps
```

### 4. Database Migration

Generate Prisma Client and run migrations:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

When prompted, name your migration (e.g., `init`).

### 5. Start the Application

Development mode (with hot reload):

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/docs`

## API Endpoints

### Authentication

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Notes (Protected - Requires JWT)

#### Create Note
```bash
POST /notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Note",
  "content": "This is the content of my note..."
}
```

#### Get All Notes (with pagination and search)
```bash
GET /notes?page=1&limit=10&search=keyword
Authorization: Bearer <token>
```

#### Get Note by ID
```bash
GET /notes/:id
Authorization: Bearer <token>
```

#### Update Note
```bash
PATCH /notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete Note
```bash
DELETE /notes/:id
Authorization: Bearer <token>
```

### AI Features (Protected - Requires JWT)

#### Summarize Note
```bash
POST /notes/:id/summarize
Authorization: Bearer <token>
```

#### Generate Tags
```bash
POST /notes/:id/tags
Authorization: Bearer <token>
```

## Example cURL Commands

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response for subsequent requests.

### 3. Create a note

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Machine Learning Basics",
    "content": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions. Common types include supervised learning, unsupervised learning, and reinforcement learning."
  }'
```

### 4. Get all notes

```bash
curl -X GET "http://localhost:3000/notes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get a specific note

```bash
curl -X GET http://localhost:3000/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Summarize a note

```bash
curl -X POST http://localhost:3000/notes/NOTE_ID/summarize \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "summary": "• Machine learning is a subset of AI\n• Enables systems to learn from experience\n• Uses algorithms to analyze data and identify patterns\n• Makes predictions and decisions\n• Types include supervised, unsupervised, and reinforcement learning"
}
```

### 7. Generate tags for a note

```bash
curl -X POST http://localhost:3000/notes/NOTE_ID/tags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "tags": ["machine-learning", "artificial-intelligence", "algorithms", "data-science"]
}
```

### 8. Update a note

```bash
curl -X PATCH http://localhost:3000/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Updated Title"
  }'
```

### 9. Delete a note

```bash
curl -X DELETE http://localhost:3000/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (Unique)
- `passwordHash`
- `createdAt`

### Notes
- `id` (UUID, Primary Key)
- `userId` (Foreign Key → Users)
- `title`
- `content` (Text)
- `summary` (Text, Nullable)
- `tags` (String Array)
- `createdAt`
- `updatedAt`

### AI Requests (Audit Log)
- `id` (UUID, Primary Key)
- `userId` (Foreign Key → Users)
- `noteId` (Foreign Key → Notes, Nullable)
- `action` (e.g., "summarize", "tags")
- `model`
- `prompt` (Text)
- `output` (Text, Nullable)
- `status` ("success" | "error")
- `errorMessage` (Text, Nullable)
- `latencyMs` (Integer, Nullable)
- `createdAt`

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
├── common/                    # Shared modules
│   ├── prisma/               # Prisma service and module
│   ├── guards/               # JWT auth guard
│   └── decorators/           # CurrentUser decorator
├── auth/                     # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/                  # Register/Login DTOs
│   └── strategies/           # JWT strategy
├── users/                    # Users module
│   ├── users.module.ts
│   └── users.service.ts
├── notes/                    # Notes module
│   ├── notes.module.ts
│   ├── notes.controller.ts
│   ├── notes.service.ts
│   └── dto/                  # Note DTOs
├── ai/                       # AI service module
│   ├── ai.module.ts
│   ├── ai.service.ts
│   └── prompts.ts
└── audit/                    # Audit logging module
    ├── audit.module.ts
    └── audit.service.ts
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ Note ownership validation on all operations
- ✅ Input validation with class-validator
- ✅ SQL injection protection (Prisma)
- ✅ CORS enabled
- ✅ Password hash never returned in responses

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict

## Development

```bash
# Development with watch mode
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Database Connection Issues
- Ensure Docker container is running: `docker-compose ps`
- Check DATABASE_URL in `.env` matches docker-compose.yml credentials
- Verify PostgreSQL is healthy: `docker-compose logs postgres`

### Hugging Face API Issues
- Verify `HF_TOKEN` is set correctly in `.env`
- Check token has inference permissions
- Some models may require API access approval
- Check Hugging Face service status

### Migration Issues
- Reset database: `npx prisma migrate reset` (⚠️ deletes all data)
- Generate fresh client: `npm run prisma:generate`

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

