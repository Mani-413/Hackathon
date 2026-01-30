// Usage: node migrate-to-mongo.js
// Reads data/students.json and inserts documents into MongoDB 'hackathon' DB -> 'students' collection.
// Make sure you have installed the 'mongodb' package first: `npm install mongodb`

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'students.json');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'hackathon';
const COLLECTION = process.env.MONGO_COLLECTION || 'students';

async function migrate() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);

    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const data = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No records found in', DATA_FILE);
      await client.close();
      return;
    }

    // Normalize/convert fields that exist in file format to DB format
    const toInsert = data.map(s => ({
      name: s.name,
      email: (s.email || '').toLowerCase(),
      phone: s.phone,
      department: s.department,
      year: s.year,
      rollNumber: s.rollNumber,
      teamName: s.teamName || '',
      registeredAt: s.registeredAt ? new Date(s.registeredAt) : new Date()
    }));

    // Insert, but skip duplicates by email or rollNumber
    for (const doc of toInsert) {
      const exists = await col.findOne({ $or: [{ email: doc.email }, { rollNumber: doc.rollNumber }] });
      if (exists) {
        console.log('Skipping duplicate:', doc.email || doc.rollNumber);
        continue;
      }
      const r = await col.insertOne(doc);
      console.log('Inserted _id=', r.insertedId.toString());
    }

    await client.close();
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

migrate();
