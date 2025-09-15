const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();

// Set strictQuery to false to fix deprecation warning
mongoose.set('strictQuery', false);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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

// Static file serving - FIXED
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Add this to handle any case sensitivity issues
app.use('/Uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve default project image with error handling
app.use('/images/default-project.jpg', (req, res, next) => {
  const defaultImagePath = path.join(__dirname, 'public/images/default-project.jpg');
  
  if (fs.existsSync(defaultImagePath)) {
    return res.sendFile(defaultImagePath);
  } else {
    // If default image doesn't exist, create a simple SVG placeholder
    const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial" font-size="16" fill="#6c757d">Project Image</text>
    </svg>`;
    
    res.set('Content-Type', 'image/svg+xml');
    res.send(placeholderSvg);
  }
});

// Debug multer configuration
app.get('/debug-multer', (req, res) => {
  const multer = require('multer');
  const path = require('path');
  
  // Check the current upload directory
  const uploadsDir = path.join(__dirname, 'public/uploads');
  const serverUploadsDir = path.join(__dirname, 'server/public/uploads');
  
  res.json({
    expectedUploadsDir: uploadsDir,
    expectedUploadsExists: fs.existsSync(uploadsDir),
    serverUploadsDir: serverUploadsDir,
    serverUploadsExists: fs.existsSync(serverUploadsDir),
    currentWorkingDir: process.cwd(),
    __dirname: __dirname
  });
});

// Debug route to check specific image file
app.use('/debug-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public/uploads', filename);
  
  res.json({
    filename: filename,
    exists: fs.existsSync(imagePath),
    path: imagePath,
    directory: path.join(__dirname, 'public/uploads')
  });
});

// Serve uploaded images with better error handling
app.use('/uploads/:imageName', (req, res, next) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'public/uploads', imageName);
  
  console.log('Requesting image:', imageName);
  console.log('Full path:', imagePath);
  
  if (fs.existsSync(imagePath)) {
    console.log('Image found, serving:', imageName);
    return res.sendFile(imagePath);
  } else {
    console.log('Image not found, redirecting to placeholder:', imageName);
    // Check if this is a browser requesting a favicon or other resource
    if (imageName.includes('favicon') || imageName.includes('logo')) {
      return next(); // Let other middleware handle this
    }
    return res.redirect('/images/default-project.jpg');
  }
});

// Database connection function
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB...');
    const connectionString = process.env.MONGODB_URI;
    
    // Add connection options to prevent timeouts
    const connectionOptions = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    };
    
    await mongoose.connect(connectionString, connectionOptions);
    
    console.log('✅ MongoDB Connected successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Session configuration function
const configureSession = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }),
    cookie: { 
      secure: false,
      httpOnly: true,
      maxAge: 60 * 60 * 1000 // 1 hour session
    }
  });
};

// View engine setup
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'server/views/pages'),
  path.join(__dirname, 'server/views/admin'),
  path.join(__dirname, 'server/views')
]);

// Method override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Test endpoints (before session to avoid flash issues)
app.get('/test-db', async (req, res) => {
  try {
    const Project = require('./server/models/Project');
    const testProject = new Project({
      title: 'Test Project',
      description: 'Test description',
      shortDescription: 'Test short'
    });
    
    await testProject.save();
    const count = await Project.countDocuments();
    
    res.json({ success: true, count, state: mongoose.connection.readyState });
  } catch (error) {
    res.json({ success: false, error: error.message, state: mongoose.connection.readyState });
  }
});

app.get('/test-image', (req, res) => {
  res.send(`
    <h1>Image Test</h1>
    <p>Testing image serving:</p>
    <ul>
      <li><a href="/uploads/image-1757424104363-246406109.jpg">Test Uploaded Image</a></li>
      <li><a href="/images/logo.png">Logo Image</a></li>
      <li><a href="/images/default-project.jpg">Default Project Image</a></li>
    </ul>
  `);
});

// Test MongoDB connection
app.get('/test-mongo', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    let status = 'unknown';
    
    switch(state) {
      case 0: status = 'disconnected'; break;
      case 1: status = 'connected'; break;
      case 2: status = 'connecting'; break;
      case 3: status = 'disconnecting'; break;
    }
    
    // Try a simple query
    const Project = require('./server/models/Project');
    const count = await Project.countDocuments().maxTimeMS(5000);
    
    res.json({
      connectionState: state,
      status: status,
      projectCount: count,
      message: 'MongoDB connection test successful'
    });
  } catch (error) {
    res.json({
      connectionState: mongoose.connection.readyState,
      status: 'error',
      error: error.message,
      message: 'MongoDB connection test failed'
    });
  }
});

// Health check (before session)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    const dbConnected = await connectDB();
    
    if (dbConnected) {
      // Configure session AFTER successful DB connection but BEFORE routes
      app.use(configureSession());
      
      // Flash messages MUST come after session
      app.use(flash());
      app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        next();
      });

      // Database connection status middleware
      app.use((req, res, next) => {
        res.locals.dbConnected = mongoose.connection.readyState === 1;
        next();
      });

      // Import routes (must come after session and flash)
      app.use('/', require('./server/routes/index'));
      app.use('/admin', require('./server/routes/admin'));
      app.use('/projects', require('./server/routes/projects'));
      app.use('/blog', require('./server/routes/blog'));
      app.use('/contact', require('./server/routes/contact'));
      app.use('/donate', require('./server/routes/donations'));
      app.use('/volunteer', require('./server/routes/volunteers'));

      // Error handling
      app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render('error', { message: 'Something went wrong!' });
      });

      // Add this route to server.js
      app.get('/test-images', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
              <title>Image Test</title>
          </head>
          <body>
              <h1>Testing Image Serving</h1>
              <h2>Uploaded Images:</h2>
              <img src="/uploads/image-1757424104363-246406109.jpg" style="width: 300px; border: 2px solid red;">
              <img src="/uploads/image-1757421154320-885881642.jpg" style="width: 300px; border: 2px solid blue;">
              <img src="/uploads/image-1757418668058-39054301.jpg" style="width: 300px; border: 2px solid green;">
              
              <h2>Static Images:</h2>
              <img src="/images/logo.png" style="width: 300px; border: 2px solid orange;">
              <img src="/images/default-project.jpg" style="width: 300px; border: 2px solid purple;">
          </body>
          </html>
        `);
      });

      // List uploaded files for debugging
app.get('/debug-uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, 'public/uploads');
  
  try {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      res.json({
        uploadsDirectory: uploadsDir,
        files: files,
        totalFiles: files.length
      });
    } else {
      res.json({
        error: 'Uploads directory does not exist',
        path: uploadsDir
      });
    }
  } catch (error) {
    res.json({
      error: error.message
    });
  }
});

      // 404 handler
      app.use((req, res) => {
        res.status(404).render('error', { message: 'Page not found' });
      });
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`🔐 Admin Login: http://localhost:${PORT}/admin/login`);
      });
    } else {
      console.log('Starting server without database...');
      
      // Basic session for flash messages even without DB
      app.use(session({
        secret: process.env.SESSION_SECRET || 'fallback_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: false,
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000
        }
      }));
      
      app.use(flash());
      app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.dbConnected = false;
        next();
      });

      // Import routes
      app.use('/', require('./server/routes/index'));
      app.use('/admin', require('./server/routes/admin'));
      app.use('/projects', require('./server/routes/projects'));
      app.use('/blog', require('./server/routes/blog'));
      app.use('/contact', require('./server/routes/contact'));
      app.use('/donate', require('./server/routes/donations'));
      app.use('/volunteer', require('./server/routes/volunteers'));

      app.listen(PORT, () => {
        console.log(`⚠️ Server running without database on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// MongoDB event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();