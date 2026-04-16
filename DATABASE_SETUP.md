# Database Setup Guide

## Option 1: Use Docker (Recommended) ⚡

### Step 1: Start Docker Desktop
- **Windows/Mac**: Search for "Docker Desktop" and open it
- **Linux**: Run `sudo systemctl start docker`
- Wait for Docker to fully load (check system tray for green indicator)

### Step 2: Start PostgreSQL Container
```bash
cd e:\Rentra
docker-compose -f docker/docker-compose.yml up -d
```

### Step 3: Apply Database Migrations
```bash
cd apps/backend
npx prisma migrate dev
```

### Step 4: Verify Setup
```bash
npx prisma studio
```
This opens Prisma Studio at http://localhost:5555 to view your database

---

## Option 2: Use Supabase (Cloud PostgreSQL) ☁️

### Step 1: Create Free Account
1. Go to https://supabase.com
2. Sign up with email
3. Create a new project
4. Copy the database connection string

### Step 2: Update .env
```bash
# Replace this:
DATABASE_URL="postgresql://postgres:farmer@localhost:5432/rentra"

# With your Supabase connection string:
DATABASE_URL="postgresql://...[your-supabase-connection]"
```

### Step 3: Run Migrations
```bash
cd apps/backend
npx prisma migrate dev
```

---

## Verify Database Connection

Run this command to test:
```bash
npx prisma db execute --stdin < prisma/schema.prisma
```

If no errors, you're ready! 🎉
