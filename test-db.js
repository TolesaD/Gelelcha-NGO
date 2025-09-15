// Create a file called test-db.js in your project root:
const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB:', conn.connection.host);
    
    // Test a simple operation
    const result = await conn.connection.db.admin().ping();
    console.log('✅ Ping result:', result);
    
    // Try to list collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('✅ Collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
};

testConnection();