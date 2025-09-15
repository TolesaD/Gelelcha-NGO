// server/db.js - Enhanced database connection handler
const mongoose = require('mongoose');

// Configure mongoose to use better timeout handling
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
};

// Enhanced query with timeout handling
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

module.exports = { connectDB, withTimeout };