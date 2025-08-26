const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Delete existing admin
    await Admin.deleteMany({});
    console.log('Deleted existing admin accounts');

    // Create new admin
    const newAdmin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      email: process.env.ADMIN_EMAIL || 'admin@gelelcha.org',
      role: 'superadmin'
    });

    await newAdmin.save();
    console.log('New admin created successfully');
    console.log('Username:', newAdmin.username);
    console.log('Email:', newAdmin.email);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
};

resetAdmin();