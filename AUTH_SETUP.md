## 🔧 Setup Checklist - Status der auth system aur Database

### ✅ What I Fixed:
- [x] Backend auth responses now use `accessToken` (not `token`)
- [x] Frontend auth handlers improved with better error messages
- [x] API routing now includes `/api` prefix
- [x] Error messages will show detailed error from backend

---

### ⚠️ What Still Needs: DATABASE

**Current Status:**
- Web app: ✅ Running on http://localhost:5175
- Backend: ✅ Running on http://localhost:3000
- **Database: ❌ NOT RUNNING** ← THIS IS THE ISSUE

When you try to register, the backend tries to save user to database, but there's no database connected, so it fails silently.

---

### 🚀 Solution: Start PostgreSQL Database

#### **Option A: Docker (Recommended)**

**Requirements:**
- Docker Desktop installed

**Steps:**
```powershell
# 1. Start Docker Desktop (search in Start Menu, open it, wait for green indicator)

# 2. In terminal, run:
cd e:\Rentra
docker-compose -f docker/docker-compose.yml up -d

# 3. Wait 10 seconds, then apply migrations:
cd apps/backend
npx prisma migrate deploy

# 4. Test it:
npx prisma studio
```

If successful, you'll see:
- ✅ Prisma Studio opens at http://localhost:5555
- ✅ Database `rentra` shows in PostgreSQL container

#### **Option B: Supabase Cloud (No Installation Needed)**

**Steps:**
1. Go to https://supabase.com and sign up (free)
2. Create a new project
3. Copy database URL from settings
4. Update `.env` in `apps/backend`:
```
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[db]?sslmode=require"
```
5. Run:
```powershell
cd e:\Rentra\apps\backend
npx prisma migrate deploy
```

---

### 📋 COMPLETE SETUP COMMANDS (Copy & Paste)

**For Docker:**
```powershell
cd e:\Rentra
docker-compose -f docker/docker-compose.yml up -d
cd apps/backend
npx prisma migrate deploy
```

**Then test registration:**
1. Go to http://localhost:5175 (web app)
2. Click "Register"
3. Fill form:
   - Name: `Ali Raza`
   - Email: `ali@example.com`
   - Phone: `+923001234567`
   - CNIC: `35202-1234567-1`
   - Password: `password123`
   - Role: `Kiraya Dar (Tenant)`
4. Click "Register"

**Expected result:** ✅ "Registration successful! 🎉" + redirects to dashboard

---

### 🔍 Debug If It Still Fails

**Step 1:** Check backend logs for errors
- Look at the terminal where backend is running
- Should see error message

**Step 2:** Check browser console
- Open: http://localhost:5175
- Press `F12` (Developer Tools)
- Go to `Console` tab
- Try registering
- Look for error message

**Step 3:** Test API directly
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"fullName":"Test","email":"test@test.com","phone":"+921234567890","cnic":"00000-0000000-0","password":"test123","role":"TENANT"}'
```

Should return either:
- ✅ Success with user data
- ❌ Error message explaining what went wrong

---

### 📞 Questions?

If you get stuck:
1. **Error message on register page?** → Share the exact error text
2. **Backend error?** → Share backend terminal output
3. **Database connection?** → Share if you ran the commands correctly

**Status after setup:**
- Web: http://localhost:5175 ✅
- Backend: http://localhost:3000 ✅
- Database: POSTGRESQL (local Docker or Supabase) ✅
- Auth Flow: User registers → saved to database → logged in ✅
