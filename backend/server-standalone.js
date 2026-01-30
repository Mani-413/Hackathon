// Standalone server using only Node.js built-in modules
// No npm dependencies required!

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper function to read students
function readStudents() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write students
function writeStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse JSON body
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  setCORSHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  try {
    // Get all students
    if (pathname === '/api/students' && method === 'GET') {
      const students = readStudents();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: students, count: students.length }));
      return;
    }

    // Register a new student
    if (pathname === '/api/register' && method === 'POST') {
      const body = await parseJSONBody(req);
      const { name, email, phone, department, year, rollNumber, teamName } = body;

      // Validation
      if (!name || !email || !phone || !department || !year || !rollNumber) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'All fields are required (name, email, phone, department, year, rollNumber)'
        }));
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid email format' }));
        return;
      }

      // Phone validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Phone number must be 10 digits' }));
        return;
      }

      const students = readStudents();

      // Check if email already exists
      const emailExists = students.some(s => s.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Email already registered' }));
        return;
      }

      // Check if roll number already exists
      const rollExists = students.some(s => s.rollNumber === rollNumber);
      if (rollExists) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Roll number already registered' }));
        return;
      }

      // Create new student
      const newStudent = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department,
        year: year,
        rollNumber: rollNumber.trim(),
        teamName: teamName ? teamName.trim() : '',
        registeredAt: new Date().toISOString()
      };

      students.push(newStudent);
      writeStudents(students);

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        message: 'Student registered successfully',
        data: newStudent
      }));
      return;
    }

    // Get student by ID
    if (pathname.startsWith('/api/students/') && method === 'GET') {
      const id = pathname.split('/')[3];
      const students = readStudents();
      const student = students.find(s => s.id === id);
      
      if (!student) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Student not found' }));
        return;
      }
      
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: student }));
      return;
    }

    // Delete student
    if (pathname.startsWith('/api/students/') && method === 'DELETE') {
      const id = pathname.split('/')[3];
      const students = readStudents();
      const filteredStudents = students.filter(s => s.id !== id);
      
      if (students.length === filteredStudents.length) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Student not found' }));
        return;
      }
      
      writeStudents(filteredStudents);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Student deleted successfully' }));
      return;
    }

    // Get statistics
    if (pathname === '/api/stats' && method === 'GET') {
      const students = readStudents();
      const stats = {
        total: students.length,
        byDepartment: {},
        byYear: {}
      };

      students.forEach(student => {
        // Count by department
        stats.byDepartment[student.department] = 
          (stats.byDepartment[student.department] || 0) + 1;
        
        // Count by year
        stats.byYear[student.year] = (stats.byYear[student.year] || 0) + 1;
      });

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: stats }));
      return;
    }

    // 404 Not Found
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));

  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`✅ API endpoints available at http://localhost:${PORT}/api`);
  console.log(`✅ No npm dependencies required - using Node.js built-in modules only!`);
});
