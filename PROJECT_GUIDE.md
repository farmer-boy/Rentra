# Rentra Project Guide

This guide explains the repository layout, how to run the applications, how their main parts connect, and how to test common API operations.

## 1. What Rentra is

Rentra is a rental marketplace project. Its repository is a pnpm/Turborepo monorepo containing:

- A React web application.
- A NestJS REST API.
- A React Native / Expo mobile application.
- A PostgreSQL database accessed through Prisma.
- Supporting packages for shared code and AI-related functionality.

## 2. Repository map

```text
Rentra/
├── apps/
│   ├── backend/          NestJS API, modules, and tests
│   ├── web/              React + Vite browser app
│   └── mobile/           Expo / React Native app
├── packages/
│   ├── database/         Prisma schema, migrations, and seed script
│   ├── ai-service/       Python AI service
│   ├── shared/           Shared package
│   └── ui/               Shared UI package
├── docker/
│   └── docker-compose.yml  Local PostgreSQL service
├── .env.example          Environment variable template
├── package.json          Root workspace scripts
├── pnpm-workspace.yaml   Workspace package configuration
└── turbo.json            Task and build configuration
```

### Web app directories

`apps/web/src/` contains:

- `pages/`: screens, grouped by product area such as auth, tenant, landlord, admin, and listings.
- `components/`: reusable React components.
- `api/`: Axios client, API functions, and shared request/response types.
- `store/`: client state such as the signed-in user.
- `hooks/`: reusable React hooks.
- `context/`: React context providers such as theming.

### Backend directories

`apps/backend/src/` contains:

- `main.ts`: application startup, `/api` prefix, CORS, validation, and Swagger.
- `app.module.ts`: root Nest module that loads the feature modules.
- `common/`: shared guards, decorators, Prisma service, and types.
- `modules/`: feature modules. Most contain a controller, service, DTOs, and module definition.

Examples include `auth`, `users`, `properties`, `listings`, `bookings`, `payments`, `reviews`, and `messages`.

## 3. Prerequisites

- Node.js (use a currently supported LTS version compatible with this repository).
- pnpm 9, as declared by the root package manifest.
- PostgreSQL 16, either installed locally or run with Docker.
- Python only if you are working with the AI service.

Check the versions:

```powershell
node --version
pnpm --version
```

## 4. Install and configure

Run from the repository root:

```powershell
pnpm install
Copy-Item .env.example .env
```

Review `.env` and set real values for the services you use. Do not commit `.env` or put real credentials in `.env.example`.

The key local backend variables are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL used by Prisma and the backend |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Access-token lifetime |
| `CLOUDINARY_*` | Image upload configuration |
| `JAZZCASH_*` | Payment integration settings |
| `AI_SERVICE_URL` | URL of the AI service |
| `FRONTEND_URL` | Frontend URL used by integrations |

The sample environment uses a local PostgreSQL host at `127.0.0.1:5432`. Make sure your actual `.env` agrees with the database service you intend to use.

## 5. Start PostgreSQL and the API

### PostgreSQL with Docker

First ensure Docker Desktop is running, then from the repository root:

```powershell
docker compose -f docker/docker-compose.yml up -d
```

Check the container:

```powershell
docker compose -f docker/docker-compose.yml ps
```

### PostgreSQL without Docker

Start your local PostgreSQL service yourself and ensure that the database and credentials in `DATABASE_URL` are valid.

### Prisma schema and migrations

The single Prisma schema is at `packages/database/prisma/schema.prisma`; migration SQL is under `packages/database/prisma/migrations/`. The backend package points to this schema, so keep the schema and its migration history together there.

Check migration status:

```powershell
pnpm --filter @rentra/backend exec prisma migrate status --schema ..\..\packages\database\prisma\schema.prisma
```

For a normal development database, Prisma's migration command is:

```powershell
pnpm --filter @rentra/backend exec prisma migrate dev --schema ..\..\packages\database\prisma\schema.prisma
```

For an already-deployed database, migration deployment is usually:

```powershell
pnpm --filter @rentra/backend exec prisma migrate deploy --schema ..\..\packages\database\prisma\schema.prisma
```

Before applying migrations to a database with real data, review the migration SQL and make a backup. Do not use `migrate reset` on a database containing data you need.

### Run the backend

In one terminal, from the repository root:

```powershell
pnpm --filter @rentra/backend start:dev
```

The API uses port `3000` by default. Keep this terminal open while using the API. Start only one backend process on that port; a second instance fails with `EADDRINUSE`.

Useful URLs:

- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`

## 6. Run the web app

Open another terminal at the repository root:

```powershell
pnpm --filter web dev
```

Vite prints the web URL when it starts (usually `http://localhost:5173`). The web API client defaults to `http://localhost:3000/api`; override it with `VITE_API_URL` if your API uses a different address.

## 7. Run the mobile app

From the repository root:

```powershell
pnpm --filter mobile start
```

Then use the Expo terminal controls to open an emulator or device. A physical phone cannot usually reach the computer's `localhost`; configure the API base URL to the computer's LAN address for device testing.

The `mobile` package uses React Native 0.76 and React 18.3. Check Expo's compatibility guidance before changing those versions.

## 8. Run the AI service

The AI service lives under `packages/ai-service`. Its Python dependencies are listed in `requirements.txt`; inspect its README or application entry point for its specific startup command. Configure `AI_SERVICE_URL` to the address where it is running.

## 9. How a web API request works

For a typical feature:

1. A page under `apps/web/src/pages/` collects the user's input.
2. An API helper under `apps/web/src/api/` sends an Axios request.
3. `apps/web/src/api/client.ts` supplies the API base URL and attaches the access token.
4. `apps/backend/src/main.ts` routes requests under `/api`.
5. A Nest controller in `apps/backend/src/modules/<feature>/` validates and routes the request.
6. A service applies business rules and calls `PrismaService`.
7. Prisma reads or writes PostgreSQL using `packages/database/prisma/schema.prisma`.
8. The controller response is returned to the web page.

DTOs (data transfer objects) describe and validate request bodies. Guards protect routes; role guards limit certain operations to users with specific roles.

## 10. Auth and user API examples

Use Swagger at `/api/docs` or Postman. API paths below include the global `/api` prefix.

### Register

`POST /api/auth/register`

```json
{
  "fullName": "Test User",
  "email": "test.user@example.com",
  "phone": "+923001234567",
  "password": "TestPass123"
}
```

Use a unique email and phone. The web registration screen currently displays a fixed `+92` prefix and submits an international-format phone number.

### Login

`POST /api/auth/login`

```json
{
  "email": "test.user@example.com",
  "password": "TestPass123"
}
```

The response includes an access token and refresh token. In Postman, choose **Authorization → Bearer Token** and paste the access token for protected requests.

### Read and update your own profile

Both routes require a bearer access token:

- `GET /api/auth/me`
- `GET /api/users/me`
- `PATCH /api/users/me`

Example PATCH body:

```json
{
  "fullName": "Updated Test User"
}
```

### Refresh and logout

Both routes take the refresh token in JSON:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`

```json
{
  "refreshToken": "paste-refresh-token-here"
}
```

Refresh rotates the token pair; use the newly returned refresh token for subsequent refresh/logout calls.

### List all users and admin actions

`GET /api/users` lists users, but requires an **admin** access token. A normal registered account gets `403 Forbidden`.

Other user-management routes such as `POST /api/users`, `PUT /api/users/{id}`, `PATCH /api/users/{id}`, and `DELETE /api/users/{id}` are also admin-only. Be cautious with delete operations.

The admin controller also has `GET /api/admin/users` with optional `role`, `status`, and `search` query parameters.

There is no public endpoint for listing every user's private account record. Do not make the listing endpoint public just to test it.

## 11. Build, lint, and tests

From the repository root:

```powershell
pnpm --filter @rentra/backend build
pnpm --filter web build
pnpm --filter web lint
```

The root scripts include:

```powershell
pnpm build
pnpm lint
pnpm dev
```

The root development command starts package development tasks through Turborepo. If you only want one service, use the package-specific command described above.

## 12. Common problems

### `EADDRINUSE :::3000`

Another process is already using port 3000. Stop the existing backend terminal before starting another one, or configure a different `PORT`.

### Prisma `P1001` / database connection failed

Confirm PostgreSQL is running, check the host/port in `DATABASE_URL`, and verify that the database exists and accepts the configured credentials.

### `Null constraint violation on cnic`

Registration does not require CNIC, and `cnic` is optional in the Prisma schema. If this error appears, the backend is connected to a database whose `User.cnic` column is still `NOT NULL`. Check that you updated the same database the backend uses; do not delete existing CNIC values.

### Prisma says migrations have failed or are pending

Read the failed migration details and review its SQL before changing migration state. Some schema migrations can alter columns or enum values. Back up important data and repair migration history deliberately rather than resetting the database.

### Registration returns `409 Conflict`

The email or phone number is already registered. Try a fresh email and phone, or sign in to the existing account.

### Protected endpoint returns `401` or `403`

- `401`: token is missing, invalid, expired, or not sent as a bearer token.
- `403`: the account is signed in but does not have the role required for the endpoint, often `ADMIN`.

## 13. Where to look first

| If you want to change... | Start with... |
| --- | --- |
| Registration/login behavior | `apps/backend/src/modules/auth/` |
| User profile or admin user management | `apps/backend/src/modules/users/` |
| Web registration/login screens | `apps/web/src/pages/auth/` |
| Frontend API calls and token handling | `apps/web/src/api/` |
| Database tables and enums | `packages/database/prisma/schema.prisma` |
| Database evolution | `packages/database/prisma/migrations/` |
| Backend startup and global configuration | `apps/backend/src/main.ts` and `app.module.ts` |
| PostgreSQL container | `docker/docker-compose.yml` |
