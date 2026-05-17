# GenStudio

## PROJECT OVERVIEW
GenStudio is a minimal, product-grade AI image generation web application built on Next.js 14, TailwindCSS, and Prisma. It leverages the Fal.ai fast inference queue for running FLUX models and utilizes Zustand alongside SWR for robust, asynchronous client state and data fetching. The stack was deliberately chosen to maximize iteration speed, maintain strict end-to-end type safety, and provide a premium "glassmorphic" UI out of the box without fighting the framework.

## QUICK START

**Prerequisites:** Node >= 20, npm

1. **Clone & Install**
```bash
git clone https://github.com/sejaljaswal/Jinxed-Network.git genstudio
cd genstudio
npm install
```

2. **Environment Variables**
Create a `.env.local` file in the root. You will need a Fal API key (get one from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)).
```bash
echo 'FAL_KEY="your_fal_api_key_here"' > .env.local
echo 'DATABASE_URL="file:./dev.db"' >> .env.local
```

3. **Database Setup**
```bash
npx prisma generate
npx prisma db push
```

4. **Run**
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## ARCHITECTURE DECISIONS
* **SQLite over Postgres:** For a prototyping assignment, standing up a Postgres container or provisioning Neon/Supabase adds unnecessary friction. SQLite allows the app to be instantly reproducible via `git clone && npm run dev` while still preserving relational integrity.
* **Fal.ai over HuggingFace:** Fal.ai provides a superior developer experience for generative media via a robust Next.js compatible JS SDK, guaranteed queueing out-of-the-box, and blazingly fast inference clusters optimized for FLUX.
* **Polling over Webhooks:** Client-side polling (via SWR and `setInterval`) bypasses the need for tools like Ngrok to expose local webhooks. It drastically simplifies the local development lifecycle and ensures firewall constraints don't break the async queue logic during review.
* **Prisma over Raw SQL:** Prisma offers strict, auto-generated TypeScript types directly from the schema, entirely eliminating an entire class of runtime errors and minimizing boilerplate compared to `better-sqlite3` or Kysely.
* **Tweak Lineage (Self-Relation):** The `parentId` field on the `Generation` model allows creating directed acyclic graphs of edits. This enables a robust UX where users understand the provenance of a specific prompt variation.

## ASYNC HANDLING
The application implements an asynchronous queue lifecycle to prevent blocking UI threads or hitting API gateway timeouts:
1. **Submit:** `POST /api/generate` inserts a `pending` row into SQLite immediately and forwards the payload to Fal.ai. Fal.ai returns a `requestId`. The DB row is updated to `processing` and linked to the `requestId`.
2. **Poll:** The UI's `useGenerate` hook drops into a 2,000ms interval, pinging `GET /api/status/[requestId]`.
3. **Complete/Fail:** The endpoint checks Fal.ai's queue status. If complete, it commits the `imageUrl` and finalizes the row to `completed`. The UI stops polling and renders the success/failure state gracefully.
*Timeout UX:* The UI leverages a fallback timeout window (enforced heavily on the client). If the Fal queue gets congested, the UI displays a skeleton loader without freezing, eventually failing gracefully if max retries are exceeded.

## WHAT I WOULD DO WITH MORE TIME
* **Webhook Architecture:** Replace the expensive 2-second HTTP polling loop with Fal.ai webhooks piped into a durable job queue (like `pg-boss` or `Inngest`) connected via Server-Sent Events (SSE) to eliminate polling delays and ensure resilient status syncing if the Next.js server crashes mid-generation.
* **Object Storage Migration:** Relying on Fal.ai's ephemeral CDN for `imageUrl`s will break when files are garbage collected (usually 30 days). I would pipe completed byte buffers directly into Cloudflare R2 / AWS S3 via pre-signed URLs during the webhook completion phase.
* **RAG Prompt Enhancer:** Add a lightweight LLM intercept layer (using Vercel AI SDK) that expands terse user prompts into highly-descriptive, aesthetic-focused FLUX prompts before they hit the Fal queue.

## TIME SPENT
* **Setup & Scaffolding:** 45 minutes (Configuring Next.js, shadcn, Tailwind, Prisma)
* **Backend API & Async Logic:** 1.5 hours (Building Fal queue integration, DB status syncing, schema relations)
* **State Management:** 1 hour (Zustand stores, SWR hooks, polling lifecycle)
* **UI/UX & Canvas:** 2.5 hours (Building polished glassmorphic forms, animated skeletons, Fabric.js editor)
* **Documentation & DevOps:** 45 minutes (Git flow, README, architecture writeup)
* **Total Time:** ~6.5 hours

## KNOWN LIMITATIONS
* **Fabric.js Canvas SSR Quirks:** Fabric dynamically reaches for the window object on initialization. While safely wrapped in a dynamic `useEffect` to prevent hydration crashes, it still relies heavily on raw DOM manipulation which circumvents standard React state flows.
* **No Authentication Boundary:** The local SQLite DB and generation APIs are completely unauthenticated. Anyone with the URL can theoretically drain the server's Fal.ai credits.
* **Local Caching Invalidation:** SWR caches the gallery efficiently, but occasionally rapid sequential tweaks might not instantly appear in the grid without a strict SWR `mutate()` cascade due to the asynchronous polling lag time.
