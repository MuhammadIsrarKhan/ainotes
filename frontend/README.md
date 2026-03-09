# AI Notes Frontend

Next.js frontend for the [AI Notes API](../) — notes with AI summarization and tag generation.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set the API URL if your backend is not on `http://localhost:3000`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Run the backend** (from the repo root, in another terminal):

   ```bash
   cd ../backend
   pnpm run start:dev
   ```

4. **Run the frontend**

   ```bash
   pnpm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001) (Next.js default port when 3000 is in use, or 3000 if you run the backend on another port).

## Features

- **Auth** — Register, login, logout (JWT)
- **Notes** — List, create, edit, delete
- **Search** — Full-text search with pagination
- **AI** — Summarize note and generate tags (Hugging Face) from the note detail page

## Project structure

- `src/app` — App Router pages and layouts
- `src/components` — Reusable components (auth guard, dashboard layout)
- `src/contexts` — Auth context (user, login, register, logout)
- `src/lib` — API client and helpers
- `src/types` — Shared TypeScript types
