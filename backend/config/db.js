const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/memory_galaxy';

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB database: memory_galaxy');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Start MongoDB locally, then run npm start again.');
    console.error('Expected URI: mongodb://127.0.0.1:27017/memory_galaxy');
    process.exit(1);
  }
}

module.exports = connectDB;
