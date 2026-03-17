# Second Brain (Frontend + Backend)

AI-powered knowledge system for capturing, organizing, and querying notes.

## Core Features

- Knowledge capture with rich text, metadata, tags, source URL, and file attachment.
- Dashboard with search, filtering, sorting (newest, oldest, title, relevance), and detail modal.
- Server-side AI enrichment: summarization and auto-tagging at write time.
- Conversational query with grounded answers and cited sources.
- Public infrastructure:
  - GET /api/public/brain/query
  - GET /api/public/brain/items
  - POST /api/public/brain/summarize
  - GET /api/public/brain/widget (embeddable iframe widget)

## Tech Stack

- Frontend: React + Vite + Tailwind + GSAP + Three.js
- Backend: Express + TypeScript
- Database: MongoDB (Mongoose)
- AI: OpenAI (server-side only, with safe fallback behavior)

## Local Setup

1. Install dependencies:

   npm install
   npm --prefix server install

2. Configure environment variables:

   Frontend (.env in app):
   - VITE_API_BASE_URL=/api
   - VITE_API_PROXY_TARGET=http://localhost:3001

   Backend (.env in app/server):
   - PORT=3001
   - MONGODB_URI=your_mongodb_uri
   - OPENAI_API_KEY=your_openai_key
   - OPENAI_MODEL=gpt-4o-mini (optional)
   - CORS_ORIGIN=http://localhost:5173
   - PUBLIC_API_KEY=optional_token_for_public_routes

3. Run app and server together:

   npm run dev

## Build

- Frontend build: npm run build
- Frontend preview: npm run preview

## Documentation

- Architecture notes: app/docs/architecture.md
- In-app docs surface: Dashboard > View Docs
