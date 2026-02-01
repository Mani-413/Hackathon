const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { appendStudentToSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

// Optional MongoDB support. If `mongodb` package is installed and a Mongo URI
// is provided (or defaults to mongodb://localhost:27017), the server will
// attempt to use MongoDB for storage. If it cannot connect, it falls back to
// the file-based storage below.
let useMongo = false;
let studentsCollection = null;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function tryConnectMongo() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(process.env.MONGO_DB_NAME || 'hackathon');
    studentsCollection = db.collection(process.env.MONGO_COLLECTION || 'students');
    useMongo = true;
    console.log(`Connected to MongoDB at ${MONGO_URI}, using DB ${db.databaseName}`);
  } catch (err) {
    useMongo = false;
    console.warn('MongoDB not available or failed to connect, falling back to file storage.');
    console.warn(err && err.message ? err.message : err);
  }
}

// Attempt connection but don't block startup indefinitely
tryConnectMongo();

// Add delay to allow MongoDB connection to establish
setTimeout(() => {
  console.log(`MongoDB connection status: ${useMongo ? 'Connected' : 'Not connected, using file storage'}`);
}, 2000);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  if (useMongo && studentsCollection) {
    // Note: this is synchronous-style wrapper to keep existing code paths.
    // Routes using async/await will query Mongo directly where needed.
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write students
function writeStudents(students) {
  if (useMongo && studentsCollection) {
    // Not used: when running with Mongo we write through collection operations.
    return;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}

// Get all students
app.get('/api/students', (req, res) => {
  (async () => {
    try {
      if (useMongo && studentsCollection) {
        const students = await studentsCollection.find({}).sort({ registeredAt: -1 }).toArray();
        return res.json({ success: true, data: students, count: students.length });
      }
      const students = readStudents();
      return res.json({ success: true, data: students, count: students.length });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Register a new student
app.post('/api/register', (req, res) => {
  (async () => {
    console.log('POST /api/register called');
    try {
      const { name, email, phone, department, year, rollNumber, accommodation, teamName, teamSize, teamMembers, domain, problemStatement, event, abstractFile } = req.body;

      // Validation
      if (!name || !email || !phone || !department || !year || !rollNumber || !teamName || !domain || !problemStatement) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required (name, email, phone, department, year, rollNumber, accommodation, teamName, domain, problemStatement)'
        });
      }

      // Handle File Upload (Base64)
      let abstractFilePath = null;
      if (abstractFile && abstractFile.data) {
        // abstractFile = { name: "filename.pdf", type: "application/pdf", data: "base64string..." }
        const matches = abstractFile.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const uniqueFilename = `${Date.now()}_${abstractFile.name.replace(/[^a-z0-9.]/gi, '_')}`;
          const targetPath = path.join(uploadsDir, uniqueFilename);

          try {
            fs.writeFileSync(targetPath, buffer);
            abstractFilePath = `/uploads/${uniqueFilename}`;
            console.log(`Saved abstract file via Base64 to ${targetPath}`);
          } catch (err) {
            console.error('Error saving file:', err);
            // Continue without file if save fails
          }
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }

      // Phone validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, error: 'Phone number must be 10 digits' });
      }

      if (useMongo && studentsCollection) {
        // Check email and roll uniqueness in DB
        const emailExists = await studentsCollection.findOne({ email: email.trim().toLowerCase() });
        if (emailExists) {
          return res.status(400).json({ success: false, error: 'Email already registered' });
        }
        const rollExists = await studentsCollection.findOne({ rollNumber: rollNumber.trim() });
        if (rollExists) {
          return res.status(400).json({ success: false, error: 'Roll number already registered' });
        }

        const newStudent = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          department: department,
          year: year,
          rollNumber: rollNumber.trim(),
          accommodation: accommodation,
          teamName: teamName.trim(),
          teamSize: teamSize || 1,
          teamMembers: teamMembers || [],
          domain: domain,
          problemStatement: problemStatement,
          event: event ? event.trim() : 'General',
          abstractFile: abstractFilePath,
          registeredAt: new Date()
        };

        const result = await studentsCollection.insertOne(newStudent);
        newStudent.id = result.insertedId.toString();

        // Async: Append to Google Sheets (Fire and Forget)
        appendStudentToSheet(newStudent).catch(err => console.error('Sheet append error:', err));

        return res.status(201).json({ success: true, message: 'Student registered successfully', data: newStudent });
      }

      // File-based fallback
      const students = readStudents();

      // Check if email already exists
      const emailExists = students.some(s => s.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Check if roll number already exists
      const rollExists = students.some(s => s.rollNumber === rollNumber);
      if (rollExists) {
        return res.status(400).json({ success: false, error: 'Roll number already registered' });
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
        accommodation: accommodation,
        teamName: teamName ? teamName.trim() : '',
        teamSize: teamSize || 1,
        teamMembers: teamMembers || [],
        domain: domain,
        problemStatement: problemStatement,
        event: event ? event.trim() : 'General',
        abstractFile: abstractFilePath,
        registeredAt: new Date().toISOString()
      };

      students.push(newStudent);
      writeStudents(students);

      // Async: Append to Google Sheets (Fire and Forget)
      appendStudentToSheet(newStudent).catch(err => console.error('Sheet append error:', err));

      return res.status(201).json({ success: true, message: 'Student registered successfully', data: newStudent });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Get student by ID
app.get('/api/students/:id', (req, res) => {
  (async () => {
    try {
      if (useMongo && studentsCollection) {
        const { ObjectId } = require('mongodb');
        let id = req.params.id;
        let query = { _id: id };
        try { query = { _id: new ObjectId(id) }; } catch (e) { query = { _id: id }; }
        const student = await studentsCollection.findOne(query);
        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
        student.id = (student._id && student._id.toString()) || student.id;
        return res.json({ success: true, data: student });
      }
      const students = readStudents();
      const student = students.find(s => s.id === req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      return res.json({ success: true, data: student });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  (async () => {
    try {
      if (useMongo && studentsCollection) {
        const { ObjectId } = require('mongodb');
        let id = req.params.id;
        let query = { _id: id };
        try { query = { _id: new ObjectId(id) }; } catch (e) { query = { _id: id }; }
        const result = await studentsCollection.deleteOne(query);
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Student not found' });
        return res.json({ success: true, message: 'Student deleted successfully' });
      }
      const students = readStudents();
      const filteredStudents = students.filter(s => s.id !== req.params.id);
      if (students.length === filteredStudents.length) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      writeStudents(filteredStudents);
      return res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Get statistics
app.get('/api/stats', (req, res) => {
  (async () => {
    try {
      if (useMongo && studentsCollection) {
        const total = await studentsCollection.countDocuments();
        const byDepartmentArr = await studentsCollection.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ]).toArray();
        const byYearArr = await studentsCollection.aggregate([
          { $group: { _id: '$year', count: { $sum: 1 } } }
        ]).toArray();

        const stats = {
          total,
          byDepartment: {},
          byYear: {}
        };
        byDepartmentArr.forEach(d => stats.byDepartment[d._id] = d.count);
        byYearArr.forEach(y => stats.byYear[y._id] = y.count);
        return res.json({ success: true, data: stats });
      }
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

      return res.json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  })();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
