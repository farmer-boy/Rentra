# 🔍 Debug Network Error in Registration

## Current Status:
- ✅ Backend: Running on http://localhost:3000/api (VERIFIED WORKING)
- ✅ Web App: Running on http://localhost:5176
- ✅ Environment: Configured with API URL

---

## Steps to Debug Network Error:

### 1. Open Developer Console (F12)
In your browser:
1. Go to http://localhost:5176/register
2. Press `F12` key
3. Go to **Console** tab
4. You'll see any JavaScript errors here

### 2. Go to Network Tab
1. Click **Network** tab in DevTools
2. Leave it open
3. Try to register
4. Look for request called `register` in the list
5. Click on it to see:
   - **Status Code** (should be 201 for success)
   - **Response** (should show user data)
   - **Headers** (check CORS headers)

### 3. Test with Different Data
If you get "already registered" error:
- Use **NEW** email, phone, CNIC
- Example:
  ```
  Name: Any Name
  Email: user-TIMESTAMP@test.com (e.g., user-1234567890@test.com)
  Phone: +923001234567
  CNIC: 35202-1234567-9
  Password: password123
  Role: Tenant
  ```

---

## Common Errors & Solutions:

### ❌ "Network Error" in Toast
**Cause:** Backend not responding
**Solution:** 
- Check backend is running: http://localhost:3000/api/docs
- Should show Swagger documentation
- If blank/error, backend crashed - check terminal

### ❌ "Email already registered"
**Cause:** You used same email twice
**Solution:** Use new email each time

### ❌ "Phone number already registered"
**Cause:** You used same phone twice
**Solution:** Use new phone each time

### ❌ "CNIC already registered"
**Cause:** You used same CNIC twice
**Solution:** Use new CNIC each time

### ❌ "CORS Error"
**Cause:** Backend CORS not configured for your frontend URL
**Solution:** Already fixed - backend allows http://localhost:5173+

### ❌ Empty Response / Silent Failure
**Cause:** Frontend state issue
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload page (Ctrl+R)
3. Try again

---

## What Should Happen:

**Step 1:** Fill form with unique data
**Step 2:** Click "Register"
**Step 3:** See loading spinner briefly
**Step 4:** Toast shows: "Registration successful! 🎉"
**Step 5:** Redirected to Tenant/Landlord Dashboard

---

## If Still Failing:

1. Take **screenshot** of the error
2. Check **Network tab** → click `register` request → show Response
3. Check **Console tab** → show any red errors
4. Share that info

---

## Direct Test (No Frontend Needed)

Run this in PowerShell to test backend directly:

```powershell
$body = @{
  fullName="TestUser"
  email="test-$(Get-Random)@test.com"
  phone="+923001234567"
  cnic="35202-$(Get-Random)-9"
  password="password123"
  role="TENANT"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

If you see `StatusCode : 201` → Backend is working ✅
