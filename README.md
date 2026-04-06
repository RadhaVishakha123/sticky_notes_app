# Sticky Notes & To-Do List — Monorepo

A production-ready full-stack mobile app monorepo built with:

| Layer | Stack |
|---|---|
| Mobile | React Native · Expo SDK 52 · Expo Router · Zustand · Axios |
| Backend | Node.js 22 · Express 4 · Prisma ORM · Zod · JWT |
| Database | PostgreSQL 16 |
| Infra | Docker · Docker Compose |
| Tooling | pnpm workspaces · TypeScript 5 · ESLint |

---

## Folder Structure

```
.
├── apps/
│   ├── api/                    # Express REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── config/         # env config + Prisma client
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── middleware/     # auth, validate, errorHandler
│   │   │   ├── routes/         # Express routers
│   │   │   ├── services/       # Business logic (TODO)
│   │   │   ├── validation/     # Zod schemas
│   │   │   ├── app.ts          # Express app factory
│   │   │   └── index.ts        # Server entry point
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── mobile/                 # Expo React Native app
│       ├── app/
│       │   ├── _layout.tsx     # Root layout
│       │   ├── index.tsx       # Auth redirect
│       │   ├── (auth)/         # Login · Register
│       │   └── (tabs)/         # Notes · Todos tabs
│       ├── components/         # Reusable UI components (TODO)
│       ├── constants/          # Colors, config
│       ├── hooks/              # Custom hooks (TODO)
│       ├── services/
│       │   └── api.ts          # Axios client + typed API methods
│       ├── store/
│       │   ├── authStore.ts    # Zustand auth store
│       │   ├── notesStore.ts   # Zustand notes store
│       │   └── todosStore.ts   # Zustand todos store
│       └── .env.example
├── packages/
│   ├── types/                  # Shared TypeScript interfaces
│   ├── tsconfig/               # Shared tsconfig presets
│   └── eslint-config/          # Shared ESLint configs
├── docker/
│   └── docker-compose.yml
├── package.json                # Root workspace scripts
└── pnpm-workspace.yaml
```

---

## Prerequisites

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **pnpm 9+** — `npm install -g pnpm`
- **Docker Desktop** — [docker.com](https://www.docker.com)
- **Expo Go** app on your phone (for device testing)

---

## Setup

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Install all workspace dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env

# Docker (optional, for docker-compose)
cp docker/.env.example docker/.env
```

Edit `apps/api/.env` — at minimum update `JWT_SECRET`.

### 4. Start PostgreSQL with Docker

```bash
pnpm docker:up
```

This starts a PostgreSQL 16 container on port **5432** with a persistent volume.

### 5. Run database migrations

```bash
pnpm db:migrate
```

Prisma creates the `users`, `notes`, and `todos` tables.

### 6. Start development servers

```bash
# Both API + mobile in parallel
pnpm dev

# Or individually
pnpm dev:api      # Express API  →  http://localhost:3000
pnpm dev:mobile   # Expo DevTools →  http://localhost:8081
```

Scan the QR code with **Expo Go** to run on a physical device.
For a device on the same network, set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000` in `apps/mobile/.env`.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/notes` | ✓ | List user notes |
| POST | `/api/notes` | ✓ | Create note |
| PUT | `/api/notes/:id` | ✓ | Update note |
| DELETE | `/api/notes/:id` | ✓ | Delete note |
| GET | `/api/todos` | ✓ | List user todos |
| POST | `/api/todos` | ✓ | Create todo |
| PUT | `/api/todos/:id` | ✓ | Update / toggle todo |
| DELETE | `/api/todos/:id` | ✓ | Delete todo |

Health check: `GET /health`

---

## Database Schema

```
User    id · email · password · name · createdAt · updatedAt
Note    id · title · content · color · userId → User
Todo    id · title · description · completed · userId → User
```

See [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) for the full schema.

---

## Useful Commands

```bash
# Development
pnpm dev                  # start all apps
pnpm dev:api              # start API only
pnpm dev:mobile           # start Expo only

# Database
pnpm db:migrate           # run migrations (dev)
pnpm db:migrate:prod      # run migrations (production)
pnpm db:studio            # open Prisma Studio in browser
pnpm db:seed              # run seed script
pnpm db:generate          # regenerate Prisma client

# Docker
pnpm docker:up            # start containers (detached)
pnpm docker:down          # stop containers
pnpm docker:logs          # follow container logs
pnpm docker:reset         # stop + remove volumes (⚠ deletes data)

# Code quality
pnpm typecheck            # TypeScript across all packages
pnpm lint                 # ESLint across all packages
pnpm build                # production build all packages

# Cleanup
pnpm clean                # remove all build artefacts
```

---

## Docker (Full Stack)

To run both the API and PostgreSQL in Docker:

```bash
cd docker
cp .env.example .env      # edit JWT_SECRET
docker compose up -d
```

The API auto-runs `prisma migrate deploy` on startup.

---

## Environment Variables

### `apps/api/.env`

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret (**required**) | — |
| `JWT_EXPIRES_IN` | Token TTL | `7d` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:8081` |

### `apps/mobile/.env`

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |

---

## What's Next

- [ ] Implement `AuthService` — bcrypt + JWT sign
- [ ] Implement `NotesService` + `TodosService` — Prisma queries
- [ ] Build mobile UI — `NoteCard`, `TodoItem`, `NoteModal` components
- [ ] Add form logic to Login / Register screens
- [ ] Implement pull-to-refresh and optimistic updates
# sticky_notes_app
