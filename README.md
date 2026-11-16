# Chatty

Chatty is a full-stack real-time chat application built with Next.js 16, Socket.io, PostgreSQL, and Prisma 7. Users can sign in with GitHub, create chat rooms, and exchange messages instantly with typing indicators and persistent message history.

## Live Demo

https://real-time-chat-app-xcrh.vercel.app/

## Features

- 🔐 GitHub OAuth authentication via NextAuth v5
- 💬 Real-time messaging with Socket.io WebSockets
- 🏠 Create and join multiple chat rooms
- ⌨️ Live typing indicators
- 📜 Persistent message history (PostgreSQL)
- 👥 Auto-join rooms with member avatars
- 📱 Responsive UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js + Express |
| Real-time | Socket.io |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (Auth.js) with GitHub OAuth |
| Deployment | Vercel (app), Render (socket server) |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- GitHub OAuth app

### 1. Clone the repo

```bash
git clone https://github.com/LefRighTT/Real-Time-Chat-app.git
cd Real-Time-Chat-app
```

### 2. Install dependencies

```bash
# Next.js app
npm install

# Socket server
cd socket-server
npm install
cd ..
```

### 3. Set up environment variables

Create `.env` in the project root:

```env
DATABASE_URL="your-direct-postgres-url"
DATABASE_URL_POOLED="your-pooled-postgres-url"
AUTH_SECRET="your-auth-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

Create `socket-server/.env`:

```env
DATABASE_URL="your-direct-postgres-url"
DATABASE_URL_POOLED="your-pooled-postgres-url"
NEXTJS_URL="http://localhost:3000"
PORT=4000
```

### 4. Set up the database

```bash
npx prisma db push
```

### 5. Run the app

In two separate terminals:

```bash
# Terminal 1 - Next.js app
npm run dev

# Terminal 2 - Socket server
cd socket-server
npm run dev
```

Visit `http://localhost:3000`

## Key Technical Decisions

**Separate socket server** — Vercel's serverless functions don't support persistent WebSocket connections, so the Socket.io server runs as a standalone Node/Express process deployed to Render.

**Prisma 7 adapter pattern** — Prisma 7 removed its internal connection engine, requiring an explicit driver adapter (`@prisma/adapter-pg`). The app uses a connection pool for runtime queries and a direct connection for migrations.

**Session pooler for Supabase** — Direct connections to Supabase on port 5432 are blocked by some networks, so the app uses Supabase's session pooler which supports prepared statements needed by Prisma migrations.

## License

MIT
