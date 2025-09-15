const mongoose = require('mongoose');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create collections
    const db = mongoose.connection.db;
    const collections = ['projects', 'blogs', 'admins', 'contacts', 'donations', 'volunteers'];
    
    for (const collection of collections) {
      try {
        await db.createCollection(collection);
        console.log(`✅ Created collection: ${collection}`);
      } catch (error) {
        if (error.codeName === 'NamespaceExists') {
          console.log(`ℹ️ Collection already exists: ${collection}`);
        } else {
          console.log(`⚠️ Error creating ${collection}:`, error.message);
        }
      }
    }
    
    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();