const express = require('express');
const mongoose = require('mongoose');
// Fix Mongoose deprecation warning
mongoose.set('strictQuery', false);
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Admin = require('./server/models/Admin');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Database connection function
const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create initial admin after successful connection
    await createInitialAdmin();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
};

// Create initial admin account if it doesn't exist
const createInitialAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('No admin accounts found. Creating initial admin...');
      
      const initialAdmin = new Admin({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        email: process.env.ADMIN_EMAIL || 'admin@gelelcha.org',
        role: 'superadmin'
      });
      
      await initialAdmin.save();
      console.log('Initial admin account created successfully');
      console.log('Username:', initialAdmin.username);
      console.log('Email:', initialAdmin.email);
      console.log('Please change the password after first login');
    } else {
      console.log('Admin account already exists');
      // Check if we can find the admin
      const admin = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
      if (admin) {
        console.log('Found admin:', admin.username, admin.email);
      } else {
        console.log('No admin found with the specified username');
      }
    }
  } catch (error) {
    console.error('Error creating initial admin:', error.message);
  }
};

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http://*", "/public/uploads/*"],
      mediaSrc: ["'self'", "http://*", "/public/uploads/*"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
app.use('/admin/', limiter);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'server/public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'server/views/pages'),
  path.join(__dirname, 'server/views/admin'),
  path.join(__dirname, 'server/views')
]);

// Routes
app.use('/', require('./server/routes/index'));
app.use('/admin', require('./server/routes/admin'));
app.use('/projects', require('./server/routes/projects'));
app.use('/blog', require('./server/routes/blog'));
app.use('/contact', require('./server/routes/contact'));
app.use('/donate', require('./server/routes/donations'));
app.use('/volunteer', require('./server/routes/volunteers'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.' 
  });
});

// Debug routes
app.use('/debug', require('./server/routes/debug'));

const PORT = process.env.PORT || 3000;

// Add method-override for PUT/DELETE forms
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Connect to database and start server
connectDB().then((isConnected) => {
  if (isConnected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to view the website`);
    });
  } else {
    console.log('Server could not start due to database connection issues');
  }
}).catch(error => {
  console.error('Failed to start server:', error);
});