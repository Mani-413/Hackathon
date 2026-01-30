# Troubleshooting Guide

## Website Not Running - Common Issues and Solutions

### Issue 1: Backend Server Not Starting

**Symptoms:**
- Error: "Cannot find module 'express'"
- Error: "npm is not recognized"
- Port 3000 already in use

**Solutions:**

1. **Install Node.js:**
   - Download from: https://nodejs.org/
   - Install the LTS version
   - Restart your computer after installation

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Check Node.js Installation:**
   ```bash
   node --version
   npm --version
   ```
   Both should show version numbers.

4. **Port Already in Use:**
   - Close any application using port 3000
   - Or change port in `backend/server.js`:
     ```javascript
     const PORT = process.env.PORT || 3001;
     ```
   - Update `frontend/script.js`:
     ```javascript
     const API_BASE_URL = 'http://localhost:3001/api';
     ```

### Issue 2: Frontend Not Loading

**Symptoms:**
- Blank page
- "Error connecting to server"
- CORS errors

**Solutions:**

1. **Use a Local Server (Required):**
   - Don't open HTML file directly (file://)
   - Use one of these methods:

   **Python:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

   **Node.js:**
   ```bash
   cd frontend
   npx http-server -p 8000
   ```

   **PHP:**
   ```bash
   cd frontend
   php -S localhost:8000
   ```

2. **Check Backend Connection:**
   - Open: http://localhost:3000/api/students
   - Should return JSON data
   - If not, backend is not running

3. **Test Connection:**
   - Open: `frontend/test.html` in browser
   - Click "Test Connection" button
   - Follow the instructions shown

### Issue 3: Form Submission Not Working

**Symptoms:**
- Form submits but nothing happens
- "Network error" message
- Students not appearing in list

**Solutions:**

1. **Check Browser Console (F12):**
   - Look for error messages
   - Check Network tab for failed requests

2. **Verify Backend is Running:**
   - Check terminal for "Server is running"
   - Test API: http://localhost:3000/api/students

3. **Check CORS:**
   - Backend has CORS enabled
   - If still issues, check browser console

### Issue 4: Data Not Persisting

**Symptoms:**
- Students disappear after restart
- Empty list after refresh

**Solutions:**

1. **Check Data File:**
   - Location: `backend/data/students.json`
   - Should be created automatically
   - Check file permissions

2. **Verify File Creation:**
   - After registering a student, check if file exists
   - File should contain JSON data

### Issue 5: Windows-Specific Issues

**Symptoms:**
- Batch files not working
- PowerShell errors

**Solutions:**

1. **Run Commands Manually:**
   ```powershell
   # Backend
   cd backend
   npm install
   npm start
   
   # Frontend (new terminal)
   cd frontend
   python -m http.server 8000
   ```

2. **Check Execution Policy:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Quick Diagnostic Steps

1. **Test Backend:**
   ```bash
   cd backend
   node --version    # Should show version
   npm install       # Install dependencies
   npm start         # Start server
   ```
   Open: http://localhost:3000/api/students

2. **Test Frontend:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Open: http://localhost:8000

3. **Check Both:**
   - Backend terminal: "Server is running on http://localhost:3000"
   - Frontend: Page loads without errors
   - Browser console (F12): No red errors

### Still Not Working?

1. **Check All Requirements:**
   - ✅ Node.js installed
   - ✅ Python installed (or use npx http-server)
   - ✅ Ports 3000 and 8000 available
   - ✅ No firewall blocking

2. **Verify Files:**
   - All files in correct folders
   - `backend/server.js` exists
   - `frontend/index.html` exists
   - `backend/package.json` exists

3. **Get Help:**
   - Check browser console (F12) for errors
   - Check backend terminal for errors
   - Share error messages for specific help

### Test Checklist

- [ ] Node.js installed and working
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Backend server starts without errors
- [ ] http://localhost:3000/api/students returns JSON
- [ ] Frontend server running (Python/Node.js)
- [ ] http://localhost:8000 loads the page
- [ ] Form can submit successfully
- [ ] Students appear in the list after registration
