# Architecture

Second Brain is built on a highly portable, scalable architecture. It follows four key principles:

## 1. Portable Architecture
The frontend is completely decoupled from the backend. The frontend is an independent Vite/React service. The backend is an Express Node.js application, which currently utilizes MongoDB. 

All interfaces between layers (such as `aiService` and `KnowledgeItems`) are abstracted. MongoDB can be swapped easily to PostgreSQL, or OpenAI can be swapped to Anthropic, without any breaking changes on the client application.

## 2. Principles-Based UX
Our UI relies on three guiding principles:
1. **Fluid Feedback**: Utilizing Framer Motion, GSAP, and smooth scroll via Lenis, interactions feel alive. Actions don’t just pop in—they glide.
2. **Intelligence First**: The application is designed assuming the AI does the heavy lifting. Note summaries, tag classification, and discovery are offloaded to an intelligent agent.
3. **Progressive Disclosure**: We avoid overwhelming the user by using modal interfaces (Command Palette, Capture Form, Chat Modal) to display deep functionalities only when summoned.

## 3. Agent Thinking
When a new note is added, an automated worker (the OpenAI integration service in Express) takes ownership of interpreting the blob of content. It processes it asynchronously, automatically augmenting the data layer with meaningful summary data and taxonomic structures (tags) so the user doesn’t have to structure it manually. Over time, as tags accumulate, the system logically connects data based on these AI-generated structures.

## 4. Infrastructure Mindset
The entire "knowledge base" isn’t just locked behind a dashboard. We expose a robust, authenticated public API route `GET /api/public/brain/query` enabling external applications or embeddable widgets to search and query the internal AI brain directly. This treats the user’s personal data as infrastructure they can query from anywhere.
