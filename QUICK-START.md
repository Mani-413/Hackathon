# 🚀 Quick Start Guide

## Step-by-Step Instructions

### Step 1: Install Node.js (If Not Already Installed)

1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Install it (use default settings)
4. **Restart your computer** after installation
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install Backend Dependencies

Open **Command Prompt** or **PowerShell** and run:

```bash
cd "c:\Users\MANIKANDAN\New folder (3)\backend"
npm install
```

Wait for installation to complete. You should see:
```
added 50+ packages
```

### Step 3: Start Backend Server

**Keep the terminal open** and run:

```bash
npm start
```

You should see:
```
Server is running on http://localhost:3000
API endpoints available at http://localhost:3000/api
```

**⚠️ Keep this terminal window open!**

### Step 4: Start Frontend Server

Open a **NEW** terminal/command prompt window and run:

**Option A - Using Python:**
```bash
cd "c:\Users\MANIKANDAN\New folder (3)\frontend"
python -m http.server 8000
```

**Option B - Using Node.js (if Python not available):**
```bash
cd "c:\Users\MANIKANDAN\New folder (3)\frontend"
npx http-server -p 8000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8000
```

### Step 5: Open Website

Open your web browser and go to:
**http://localhost:8000**

You should see the Hackathon Registration Portal!

### Step 6: Test Registration

1. Fill out the registration form
2. Click "Register for Hackathon"
3. You should see a success message
4. The student should appear in the "Registered Students" list below

## Using Batch Files (Windows - Easier)

Instead of manual steps, you can use:

1. **Double-click `start-all.bat`** - Starts both servers automatically
2. Wait for both windows to open
3. Open browser: http://localhost:8000

## Verify Everything Works

### Test Backend API:
Open in browser: http://localhost:3000/api/students
- Should show: `{"success":true,"data":[],"count":0}`

### Test Frontend:
Open: http://localhost:8000
- Page should load
- Form should be visible
- No errors in browser console (F12)

### Test Connection:
Open: `frontend/test.html` in browser
- Click "Test Connection"
- Should show "Connection Successful"

## Common Issues

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart computer after installation

### "Port 3000 already in use"
- Another application is using port 3000
- Close that application
- Or change port in `backend/server.js` (line 8)

### "Cannot find module 'express'"
- Dependencies not installed
- Run: `cd backend && npm install`

### Frontend shows "Error connecting to server"
- Backend is not running
- Check backend terminal for errors
- Make sure backend shows "Server is running"

### Page is blank or not loading
- Make sure you're using a local server (not file://)
- Check browser console (F12) for errors
- Verify frontend server is running

## Need More Help?

- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions
- See [SETUP.md](SETUP.md) for alternative setup methods
- Check browser console (F12) for specific error messages

## Summary

✅ **Backend running:** Terminal shows "Server is running on http://localhost:3000"
✅ **Frontend running:** Terminal shows "Serving HTTP on port 8000"
✅ **Website working:** http://localhost:8000 loads correctly
✅ **Form works:** Can register students successfully

If all ✅ are checked, you're good to go! 🎉
