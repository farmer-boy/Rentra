# 🚀 QUICK START GUIDE - Rentra Web

## 30-Second Setup

```bash
cd e:\Rentra
pnpm install
cd apps\web
pnpm run dev
```

Open: **http://localhost:5173**

---

## 📋 Checklist Before Running

- [ ] PowerShell open (not Command Prompt)
- [ ] pnpm installed globally (`npm install -g pnpm`)
- [ ] Node.js 18+ installed
- [ ] In directory: `e:\Rentra`

---

## ✅ What You'll See

1. **Login Page** (http://localhost:5173/login)
   - Enter any email & password
   - Click Login
   - You'll be redirected to Tenant Dashboard

2. **Tenant Dashboard** (http://localhost:5173/tenant)
   - Sidebar with 9 navigation items
   - Stats cards at top
   - Content area below
   - Click any sidebar item to navigate

3. **Available Pages**
   - Dashboard
   - Browse Listings (grid of properties)
   - AI Fake Detector (fraud detection)
   - Rent Estimator (price calculator)
   - Trust Scores (user ratings)
   - Digital Agreements (contract templates)
   - Payments (payment history)
   - Disputes (dispute resolution)
   - Profile (user profile)

---

## 🎨 Design Features

- ✓ Dark theme throughout
- ✓ All pages match wireframe exactly
- ✓ Responsive to screen size
- ✓ Interactive buttons & forms
- ✓ Hover effects on cards
- ✓ Status badges & indicators
- ✓ Professional typography
- ✓ Smooth transitions

---

## 🔧 Commands Reference

| Command | What it does |
|---------|------------|
| `pnpm install` | Install all dependencies |
| `pnpm run dev` | Start dev server (http://localhost:5173) |
| `pnpm run build` | Create production build |
| `pnpm run preview` | Preview production build locally |
| `pnpm run lint` | Check code style |

---

## ❌ If Something Goes Wrong

### Problem: `pnpm not found`
```bash
npm install -g pnpm
```

### Problem: Port 5173 already in use
Vite will automatically use next available port (5174, 5175, etc.)

### Problem: Dependencies error
```bash
# From e:\Rentra
rm node_modules pnpm-lock.yaml -Force -Recurse
pnpm install
```

### Problem: vite command not found
```bash
cd e:\Rentra\apps\web
pnpm install
pnpm run dev
```

---

## 🎯 Test the App

1. **Login**
   - Go to http://localhost:5173/login
   - Enter: email=test@example.com, password=anything
   - Click Login → Redirects to /tenant

2. **Navigate**
   - Use sidebar to click different pages
   - URLs update (e.g., /tenant/listings)
   - Back button works

3. **Interact**
   - Click buttons
   - Input in forms
   - Scroll tables
   - View all content

---

## 📂 Project Structure

```
e:\Rentra\
├── apps\
│   └── web\              # React app
│       └── src\
│           ├── pages\    # All 11 pages
│           ├── components\
│           │   ├── layout\
│           │   └── ui\
│           ├── App.tsx   # Routes
│           └── main.tsx  # Entry
├── wireframe\           # Design reference
├── packages\            # Shared code
└── docker\              # Docker config
```

---

## 🌐 Page URLs (after login)

**Tenant Dashboard:**
- http://localhost:5173/tenant
- http://localhost:5173/tenant/listings
- http://localhost:5173/tenant/detector
- http://localhost:5173/tenant/estimator
- http://localhost:5173/tenant/trust
- http://localhost:5173/tenant/agreement
- http://localhost:5173/tenant/payments
- http://localhost:5173/tenant/disputes
- http://localhost:5173/tenant/profile

**Landlord:**
- http://localhost:5173/landlord

**Admin:**
- http://localhost:5173/admin

---

## 💡 Tips

- **Hot Reload**: Changes to code auto-refresh (Vite magic ✨)
- **Console**: Open DevTools (F12) to see console errors
- **Mock Data**: All pages use mock data right now (ready for backend)
- **No Build Step**: Vite compiles on-the-fly (super fast)
- **Files Changed**: Just save, refresh browser = updated

---

## ✨ Features That Work

✅ Login/Register
✅ Role-based routing
✅ Sidebar navigation
✅ All page layouts
✅ Cards & tables
✅ Forms & inputs
✅ Buttons & interactions
✅ Dark theme
✅ Responsive design
✅ Icons & badges

---

## 🔌 What's Not Wired Yet

These are ready to connect once backend is available:
- API calls (use mock data now)
- User authentication (uses mock)
- Data persistence (browser memory only)
- Real notifications (toast shows but no backend)

---

## 📞 Support

If you see errors in console:
1. Check internet connection
2. Make sure pnpm installed: `pnpm --version`
3. Try: `pnpm install --force`
4. Check Node version: `node --version` (should be 18+)
5. Restart dev server (`Ctrl+C` then `pnpm run dev`)

---

## 🎉 You're Ready!

```bash
cd e:\Rentra
pnpm install
cd apps\web
pnpm run dev
```

Then open http://localhost:5173 in your browser.

Happy coding! 🚀
