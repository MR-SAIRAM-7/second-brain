# Architecture

Second Brain is implemented as a decoupled React frontend plus Express API backend with AI augmentation and a public infrastructure surface.

## 1. Portable Architecture

- Frontend: Vite + React + Tailwind in app/src.
- Backend: Express + TypeScript in app/server.
- Database: MongoDB with Mongoose models (KnowledgeItem).
- AI boundary: app/server/services/openaiService.ts exposes summarization, auto-tagging, and query-answering.

Because boundaries are API-first, components are swappable:

- MongoDB can be replaced by PostgreSQL via a repository layer change.
- OpenAI calls can be replaced with Claude/Gemini in one service module.
- Frontend can migrate to Next.js without changing core data contracts.

## 2. Principles-Based UX

The product follows five interaction principles:

1. Fluid Feedback: animated loading, hover states, and smooth transitions across capture, filtering, and chat.
2. Intelligence First: each note is enriched server-side with summary and tags at write-time.
3. Progressive Disclosure: power features are behind modals (capture, AI chat, command palette) to reduce cognitive load.
4. Grounded Answers: AI responses cite matched notes instead of generating free-floating output.
5. Keyboard Efficiency: command palette and save shortcuts accelerate capture for power users.

## 3. Agent Thinking

The system improves itself over time through automated enrichment:

- On note creation, backend processing generates summary + auto-tags.
- Public query route retrieves candidate notes and produces a grounded answer with cited sources.
- Fallback logic keeps the app operational even when AI keys are missing.

This creates compounding retrieval quality as the knowledge base grows.

## 4. Infrastructure Mindset

The brain is exposed as reusable infrastructure:

- GET /api/public/brain/query: conversational query with answer + confidence + sources.
- GET /api/public/brain/items: externally consumable filtered item feed.
- POST /api/public/brain/summarize: summarize arbitrary content server-side.
- GET /api/public/brain/widget: embeddable iframe search widget.

Optional PUBLIC_API_KEY gating allows protected public access while preserving simple local development.
