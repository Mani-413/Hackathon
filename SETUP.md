# Setup Instructions - Hackathon Registration System

## Quick Start Guide

### Option 1: Using Batch Files (Windows - Easiest)

1. **Double-click `start-all.bat`** - This will start both backend and frontend automatically
2. Wait for both servers to start
3. Open your browser and go to: **http://localhost:8000**

### Option 2: Manual Setup

#### Step 1: Install Backend Dependencies

Open a terminal/command prompt and run:

```bash
cd backend
npm install
```

#### Step 2: Start Backend Server

```bash
npm start
```

You should see:
```
Server is running on http://localhost:3000
API endpoints available at http://localhost:3000/api
```

**Keep this terminal window open!**

#### Step 3: Start Frontend Server

Open a **NEW** terminal/command prompt window and run:

**Option A - Using Python:**
```bash
cd frontend
python -m http.server 8000
```

**Option B - Using Node.js http-server:**
```bash
cd frontend
npx http-server -p 8000
```

**Option C - Using PHP:**
```bash
cd frontend
php -S localhost:8000
```

#### Step 4: Open in Browser

Open your web browser and navigate to:
**http://localhost:8000**

## Troubleshooting

### Problem: "Cannot find module 'express'"
**Solution:** Run `npm install` in the backend folder

### Problem: "Port 3000 already in use"
**Solution:** 
- Close any other application using port 3000
- Or change the port in `backend/server.js` (line 8): `const PORT = process.env.PORT || 3001;`
- Then update `frontend/script.js` (line 1): `const API_BASE_URL = 'http://localhost:3001/api';`

### Problem: "Port 8000 already in use"
**Solution:** Use a different port:
```bash
python -m http.server 8080
```
Then open: http://localhost:8080

### Problem: Frontend shows "Error connecting to server"
**Solution:** 
1. Make sure backend is running (check terminal for "Server is running")
2. Check if backend is on http://localhost:3000
3. Open browser console (F12) to see detailed error messages

### Problem: "npm is not recognized"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "python is not recognized"
**Solution:** 
- Install Python from https://www.python.org/
- Or use Node.js http-server: `npx http-server frontend -p 8000`

## Testing the System

1. **Test Backend API:**
   - Open: http://localhost:3000/api/students
   - Should return: `{"success":true,"data":[],"count":0}`

2. **Test Frontend:**
   - Open: http://localhost:8000
   - Fill out the registration form
   - Submit and check if student appears in the list

## File Structure

```
.
├── backend/
│   ├── server.js          # Backend API server
│   ├── package.json       # Backend dependencies
│   └── data/
│       └── students.json   # Student data (auto-created)
├── frontend/
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styling
│   └── script.js          # Frontend JavaScript
├── start-backend.bat      # Start backend only
├── start-frontend.bat     # Start frontend only
├── start-all.bat          # Start both servers
└── README.md              # Full documentation
```

## Requirements

- **Node.js** (v14 or higher) - https://nodejs.org/
- **npm** (comes with Node.js)
- **Python 3** (for frontend server) OR use `npx http-server` instead

## Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal for error messages
3. Verify both servers are running
4. Make sure ports 3000 and 8000 are not blocked by firewall
