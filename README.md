# Rentra

Rentra is a rental marketplace monorepo built with pnpm + Turborepo.

## Stack

- Web app: React + Vite
- Backend: NestJS + Prisma + PostgreSQL
- Mobile app: Expo / React Native
- Shared packages: database, shared utilities, UI, AI service

## Repository structure

```text
Rentra/
├── apps/
│   ├── backend/
│   ├── web/
│   └── mobile/
├── packages/
│   ├── database/
│   ├── ai-service/
│   ├── shared/
│   └── ui/
├── docker/
├── .env.example
├── PROJECT_GUIDE.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Prerequisites

- Node.js LTS
- pnpm 9
- PostgreSQL 16 or Docker Desktop
- Python (only for AI service work)

## Quick setup

From the repo root:

```powershell
pnpm install
Copy-Item .env.example .env
```

Then review and adjust `.env` for your local database and service URLs.

## Start the database

With Docker:

```powershell
docker compose -f docker/docker-compose.yml up -d
```

Check it:

```powershell
docker compose -f docker/docker-compose.yml ps
```

## Prisma and backend

Generate Prisma client:

```powershell
pnpm --filter @rentra/backend exec prisma generate --schema ..\..\packages\database\prisma\schema.prisma
```

Run migrations:

```powershell
pnpm --filter @rentra/backend exec prisma migrate dev --schema ..\..\packages\database\prisma\schema.prisma
```

Start backend:

```powershell
pnpm --filter @rentra/backend start:dev
```

The API runs on `http://localhost:3000/api` and Swagger is at `http://localhost:3000/api/docs`.

## Start the web app

```powershell
pnpm --filter web dev
```

The app usually runs on `http://localhost:5173`.

## Start mobile app

```powershell
pnpm --filter mobile start
```

## Build verification

The monorepo should build cleanly with:

```powershell
pnpm build
```

## Additional docs

For repository-level architecture details, modules, auth usage, and request flow, see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).
