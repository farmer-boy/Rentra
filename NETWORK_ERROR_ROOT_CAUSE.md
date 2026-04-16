# 🔴 NETWORK ERROR: ROOT CAUSE & FIX

## The Problem (In Plain English)

When you click "Register", here's what happens:

1. **Your form** → sends data to backend ✅
2. **Backend** → receives data ✅
3. **Backend** → tries to save to **DATABASE** ❌ **← THIS FAILS!**
4. **Database** → not running/configured ❌
5. **Frontend** → shows "Network Error" ❌

---

## Why?

**The `.env` file says:**
```
DATABASE_URL="postgresql://postgres:farmer@localhost:5432/rentra"
```

This tells backend to connect to PostgreSQL at `localhost:5432`, but:
- ❌ PostgreSQL is NOT running on your machine
- ❌ OR you don't have it installed
- ❌ OR you don't have Docker running

So when backend tries to save user data, it fails.

---

## The Fix (Choose Easiest)

### **✅ Best: Use Supabase Cloud (Recommended)**

**Why?**
- No installation needed
- Free forever tier
- Works immediately
- Cloud-based (no local setup)

**Time: 5 minutes**

```
1. Go: https://supabase.com
2. Sign up (free)
3. Create project
4. Wait 3 minutes for setup
5. Copy database URL
6. Paste into e:\Rentra\apps\backend\.env
7. Run: npx prisma migrate deploy
8. Done!
```

**Full guide:** See `SUPABASE_QUICK_START.md`

---

### **✅ Alternative: Use Docker + Local PostgreSQL**

**Why?**
- Runs locally
- Better for development
- Closer to production

**Time: 10 minutes**

```
1. Start Docker Desktop (search in Start Menu)
2. Wait 30 seconds for it to fully load
3. Run: docker-compose -f docker/docker-compose.yml up -d
4. Wait 10 seconds
5. Run: npx prisma migrate deploy
6. Done!
```

**Full guide:** See `DATABASE_SETUP.md`

---

### **✅ Alternative: Install Local PostgreSQL**

**Why?**
- Most traditional
- Full control
- No Docker needed

**Time: 15 minutes**

```
1. Download: https://www.postgresql.org/download/
2. Install (use password: farmer)
3. Create database: rentra
4. Run: npx prisma migrate deploy
5. Done!
```

---

## After Setup: Test Registration

1. Go to: http://localhost:5176/register
2. Fill form with **unique data each time**:
   ```
   Name: Ali Raza
   Email: ali-TEST-1@test.com  (change the 1)
   Phone: +923301234567  (different number)
   CNIC: 35202-1234567-5  (different CNIC)
   Password: password123
   Role: Tenant
   ```
3. Click **Register**
4. Should see: ✅ "Registration successful! 🎉"
5. Redirected to dashboard ✅

---

## Verify Database is Connected

After migrations, run:
```powershell
cd e:\Rentra\apps\backend
npx prisma studio
```

Opens: http://localhost:5555

You should see:
- ✅ User table (empty)
- ✅ Listing table
- ✅ Agreement table
- etc.

If you see tables → **Database is working!** ✅

---

## Quick Checklist

- [ ] I chose a database option (Supabase recommended)
- [ ] I have database running OR Supabase account created
- [ ] I updated `.env` with database URL
- [ ] I ran `npx prisma migrate deploy`
- [ ] I ran `npx prisma studio` and saw tables
- [ ] I went to http://localhost:5176/register
- [ ] I filled form with unique data
- [ ] I clicked Register
- [ ] I got "Registration successful! 🎉" ✅

---

## Still Getting Error?

### Error: "Network error"
→ Database is not found/running
→ Go back and complete database setup steps
→ Verify with `npx prisma studio`

### Error: "timeout"
→ Database is slow to respond
→ Check internet connection (if using cloud)
→ Restart backend: `pnpm run dev` in backend folder

### Error: "Database migrations failed"
→ Check `.env` DATABASE_URL is correct
→ Make sure all characters are copied (especially password)
→ Try again - sometimes timing issue

### Error: "ECONNREFUSED"
→ Database server is not running
→ If local: start Docker or PostgreSQL service
→ If Supabase: check internet connection

---

## Need Help?

Tell me:
1. **Which option you chose** (Supabase/Docker/Local PostgreSQL)
2. **What error you see** in browser
3. **Output of this command:**
   ```powershell
   cd e:\Rentra\apps\backend
   npx prisma studio
   ```

Then I can help you debug!
