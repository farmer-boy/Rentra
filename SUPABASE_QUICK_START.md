# ⚡ QUICK START: Supabase Setup (5 minutes)

## Step 1: Create Supabase Account (2 min)
1. Open: https://supabase.com
2. Click **"Start your project"**
3. Sign up (Google/GitHub/Email)
4. Create new project
5. **Wait** - it takes 2-3 minutes to initialize
6. You'll see dashboard with tables

## Step 2: Get Database URL (1 min)
1. In Supabase dashboard, look for **"Connect"** button
2. Select **"PostgreSQL"**
3. Copy the URI section
4. It should look like:
```
postgresql://postgres:XXXXXXXX@db.XXXXXXXX.supabase.co:5432/postgres?sslmode=require
```

## Step 3: Update Backend Config (1 min)
1. Open: `e:\Rentra\apps\backend\.env`
2. Find this line:
```
DATABASE_URL="postgresql://postgres:farmer@localhost:5432/rentra"
```
3. Replace entire line with your Supabase URL from Step 2
4. Save file

## Step 4: Setup Database (1 min)
Open PowerShell and run:
```powershell
cd e:\Rentra\apps\backend
npx prisma migrate deploy
```

Wait for: `✓ All migrations have been successfully applied to the database`

## Step 5: Test It! (Instant)
1. Open browser: http://localhost:5176/register
2. Fill form:
   - Name: Test User
   - Email: test@test.com
   - Phone: +923001234567
   - CNIC: 35202-1234567-1
   - Password: password123

3. Click **Register**
4. Should show: ✅ "Registration successful! 🎉"

## Done! 🎉

Your auth system is now working with real database!

---

## If It Fails:

**Error: "Can't connect to database"**
- Check DATABASE_URL in .env
- Make sure you copied full URL with password
- Check that `sslmode=require` is at end

**Error: "migrations failed"**
- Make sure database URL is correct
- Make sure Supabase project is ready (not still loading)
- Try again in 30 seconds

**Still network error in browser?**
1. Press F12 in browser
2. Go to Network tab
3. Try registering
4. Look for "register" request
5. Click it and see Response
6. Share the error with status code
