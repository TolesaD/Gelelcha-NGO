const mongoose = require('mongoose');

// Import all models to ensure they're registered with Mongoose
const Admin = require('./Admin');
const Blog = require('./Blog');
const Contact = require('./Contact');
const Donation = require('./Donation');
const Project = require('./Project');
const Volunteer = require('./Volunteer');

// Export all models
module.exports = {
  Admin,
  Blog,
  Contact,
  Donation,
  Project,
  Volunteer,
  mongoose
};