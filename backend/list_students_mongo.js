const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB_NAME || 'hackathon');
    const col = db.collection(process.env.MONGO_COLLECTION || 'students');
    const docs = await col.find({}).sort({ registeredAt: -1 }).limit(20).toArray();
    console.log('Found', docs.length, 'documents:');
    docs.forEach(d => console.log(JSON.stringify(d)));
  } catch (err) {
    console.error('Error connecting to Mongo:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();