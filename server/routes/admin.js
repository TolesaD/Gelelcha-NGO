const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Import models from index
const { Admin, Blog, Contact, Donation, Project, Volunteer, mongoose } = require('../models/index');

// ✅ FIXED: Import multer from your centralized middleware
const { upload } = require('../middleware/upload');

// ✅ REMOVE the duplicate multer configuration from here
// (Delete everything from "Ensure uploads directory exists" to the end of the multer config)

// Simple connection check
const checkDBConnection = () => {
  return mongoose.connection.readyState === 1;
};

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected - ready for operations');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// SIMPLE auth middleware - FIXED
const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/admin/login');
};

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login - Gelelcha Charity',
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg')
  });
});

// Admin login processing - SIMPLIFIED
router.post('/login', [
  check('username', 'Username is required').notEmpty(),
  check('password', 'Password is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/login', {
      title: 'Admin Login - Gelelcha Charity',
      error_msg: 'Please fill in all fields',
      errors: errors.array(),
      username: req.body.username
    });
  }

  const { username, password } = req.body;
  console.log('Login attempt:', { username });

  try {
    // Simple credential check - will prompt for login every time
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      req.session.admin = true;
      req.session.adminName = username;
      
      req.flash('success_msg', 'Welcome back, admin!');
      return res.redirect('/admin/dashboard');
    } else {
      req.flash('error_msg', 'Invalid credentials');
      return res.redirect('/admin/login');
    }
  } catch (error) {
    console.error('Unexpected login error:', error);
    req.flash('error_msg', 'Server error during login. Please try again.');
    return res.redirect('/admin/login');
  }
});

// Admin dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.render('admin/dashboard', {
        title: 'Dashboard - Gelelcha Admin',
        adminName: req.session.adminName,
        projectCount: 0,
        donationCount: 0,
        volunteerCount: 0,
        blogCount: 0,
        contactCount: 0,
        currentPage: 'dashboard',
        error_msg: 'Database not connected'
      });
    }
    
    const [
      projectCount,
      donationCount,
      volunteerCount,
      blogCount,
      contactCount
    ] = await Promise.all([
      Project.countDocuments().maxTimeMS(5000).catch(() => 0),
      Donation.countDocuments().maxTimeMS(5000).catch(() => 0),
      Volunteer.countDocuments().maxTimeMS(5000).catch(() => 0),
      Blog.countDocuments().maxTimeMS(5000).catch(() => 0),
      Contact.countDocuments().maxTimeMS(5000).catch(() => 0)
    ]);
    
    res.render('admin/dashboard', {
      title: 'Dashboard - Gelelcha Admin',
      adminName: req.session.adminName,
      projectCount,
      donationCount,
      volunteerCount,
      blogCount,
      contactCount,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Dashboard - Gelelcha Admin',
      adminName: req.session.adminName,
      projectCount: 0,
      donationCount: 0,
      volunteerCount: 0,
      blogCount: 0,
      contactCount: 0,
      currentPage: 'dashboard',
      error_msg: 'Error loading dashboard'
    });
  }
});

// Admin Projects Management
router.get('/projects', auth, async (req, res) => {
  try {
    console.log('Fetching projects, connection state:', mongoose.connection.readyState);
    
    if (!checkDBConnection()) {
      return res.render('admin/manage-projects', {
        title: 'Manage Projects - Gelelcha Admin',
        adminName: req.session.adminName,
        projects: [],
        currentPage: 'projects',
        error_msg: 'Database not connected. Please try again.'
      });
    }
    
    const projects = await Project.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    
    res.render('admin/manage-projects', {
      title: 'Manage Projects - Gelelcha Admin',
      adminName: req.session.adminName,
      projects: projects,
      currentPage: 'projects',
      dbConnected: true
    });
  } catch (error) {
    console.error('Projects page error:', error);
    res.render('admin/manage-projects', {
      title: 'Manage Projects - Gelelcha Admin',
      adminName: req.session.adminName,
      projects: [],
      currentPage: 'projects',
      error_msg: 'Error loading projects: ' + error.message
    });
  }
});

// NEW PROJECT FORM
router.get('/projects/new', auth, (req, res) => {
  res.render('admin/project-form', {
    title: 'Add New Project - Gelelcha Admin',
    adminName: req.session.adminName,
    currentPage: 'projects',
    project: null,
    formAction: '/admin/projects',
    formMethod: 'POST'
  });
});

// EDIT PROJECT FORM
router.get('/projects/edit/:id', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected');
      return res.redirect('/admin/projects');
    }
    
    const project = await Project.findById(req.params.id).maxTimeMS(5000);
    
    if (!project) {
      req.flash('error_msg', 'Project not found');
      return res.redirect('/admin/projects');
    }
    
    res.render('admin/project-form', {
      title: 'Edit Project - Gelelcha Admin',
      adminName: req.session.adminName,
      currentPage: 'projects',
      project: project,
      formAction: `/admin/projects/${project._id}`,
      formMethod: 'PUT'
    });
  } catch (error) {
    console.error('Edit project error:', error);
    req.flash('error_msg', 'Error loading project for editing');
    res.redirect('/admin/projects');
  }
});

// NEW BLOG FORM
router.get('/blog/new', auth, (req, res) => {
  res.render('admin/blog-form', {
    title: 'Add New Blog Post - Gelelcha Admin',
    adminName: req.session.adminName,
    currentPage: 'blog',
    blog: null,
    formAction: '/admin/blog',
    formMethod: 'POST'
  });
});

// EDIT BLOG FORM
router.get('/blog/edit/:id', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected');
      return res.redirect('/admin/blog');
    }
    
    const blog = await Blog.findById(req.params.id).maxTimeMS(5000);
    
    if (!blog) {
      req.flash('error_msg', 'Blog post not found');
      return res.redirect('/admin/blog');
    }
    
    res.render('admin/blog-form', {
      title: 'Edit Blog Post - Gelelcha Admin',
      adminName: req.session.adminName,
      currentPage: 'blog',
      blog: blog,
      formAction: `/admin/blog/${blog._id}`,
      formMethod: 'PUT'
    });
  } catch (error) {
    console.error('Edit blog error:', error);
    req.flash('error_msg', 'Error loading blog post for editing');
    res.redirect('/admin/blog');
  }
});

// Admin Blog Management
router.get('/blog', auth, async (req, res) => {
  try {
    console.log('Fetching blogs, connection state:', mongoose.connection.readyState);
    
    if (!checkDBConnection()) {
      return res.render('admin/manage-blog', {
        title: 'Manage Blog - Gelelcha Admin',
        adminName: req.session.adminName,
        blogs: [],
        currentPage: 'blog',
        error_msg: 'Database not connected. Please try again.'
      });
    }
    
    const blogs = await Blog.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    
    res.render('admin/manage-blog', {
      title: 'Manage Blog - Gelelcha Admin',
      adminName: req.session.adminName,
      blogs: blogs,
      currentPage: 'blog',
      dbConnected: true
    });
  } catch (error) {
    console.error('Blog page error:', error);
    res.render('admin/manage-blog', {
      title: 'Manage Blog - Gelelcha Admin',
      adminName: req.session.adminName,
      blogs: [],
      currentPage: 'blog',
      error_msg: 'Error loading blog posts: ' + error.message
    });
  }
});

// Create project - Enhanced with better error handling
router.post('/projects', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Project creation attempted - files:', req.files);
    console.log('Database connection state:', mongoose.connection.readyState);
    
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected. Please try again.');
      return res.redirect('/admin/projects/new');
    }
    
    const formData = {
      ...req.body,
      isFeatured: req.body.isFeatured === 'on' // Convert checkbox to boolean
    };
    
    // Handle image upload
    if (req.files && req.files['image'] && req.files['image'][0]) {
      formData.image = req.files['image'][0].filename;
    } else {
      formData.image = 'default-project.jpg';
    }
    
    // Handle video upload
    if (req.files && req.files['video'] && req.files['video'][0]) {
      formData.video = req.files['video'][0].filename;
    } else {
      formData.video = '';
    }
    
    // Convert numeric fields
    if (formData.targetAmount) {
      formData.targetAmount = parseFloat(formData.targetAmount);
    } else {
      formData.targetAmount = 0;
    }
    
    if (formData.raisedAmount) {
      formData.raisedAmount = parseFloat(formData.raisedAmount);
    } else {
      formData.raisedAmount = 0;
    }
    
    console.log('Creating project with data:', formData);
    
    const project = new Project(formData);
    await project.save();
    
    console.log('Project created successfully:', project._id);
    req.flash('success_msg', 'Project created successfully!');
    res.redirect('/admin/projects');
    
  } catch (error) {
    console.error('Error creating project:', error);
    req.flash('error_msg', 'Error creating project: ' + error.message);
    res.redirect('/admin/projects/new');
  }
});

// Create blog post
router.post('/blog', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Blog creation attempted - files:', req.files);
    console.log('Database connection state:', mongoose.connection.readyState);
    
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected. Please try again.');
      return res.redirect('/admin/blog/new');
    }
    
    const blogData = {
      ...req.body,
      author: req.session.adminName,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      status: req.body.status || 'published'
    };
    
    if (req.files && req.files['image']) {
      blogData.image = req.files['image'][0].filename;
    } else {
      blogData.image = 'default-blog.jpg';
    }
    
    if (req.files && req.files['video']) {
      blogData.video = req.files['video'][0].filename;
    }
    
    console.log('Creating blog with data:', blogData);
    
    const blog = new Blog(blogData);
    await blog.save();
    
    console.log('Blog created successfully:', blog._id);
    req.flash('success_msg', 'Blog post created successfully!');
    res.redirect('/admin/blog');
    
  } catch (error) {
    console.error('Error creating blog post:', error);
    req.flash('error_msg', 'Error creating blog post: ' + error.message);
    res.redirect('/admin/blog/new');
  }
});

// Update project function
const updateProjectHandler = async (req, res) => {
  try {
    console.log('Project update attempted - files:', req.files);
    
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected. Please try again.');
      return res.redirect(`/admin/projects/edit/${req.params.id}`);
    }
    
    const updateData = {
      ...req.body,
      isFeatured: req.body.isFeatured === 'on'
    };
    
    if (req.files && req.files['image']) {
      updateData.image = req.files['image'][0].filename;
    }
    
    if (req.files && req.files['video']) {
      updateData.video = req.files['video'][0].filename;
    }
    
    await Project.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Project updated successfully!');
    res.redirect('/admin/projects');
    
  } catch (error) {
    console.error('Error updating project:', error);
    req.flash('error_msg', 'Error updating project: ' + error.message);
    res.redirect(`/admin/projects/edit/${req.params.id}`);
  }
};

// Update blog post function
const updateBlogHandler = async (req, res) => {
  try {
    console.log('Blog update attempted - files:', req.files);
    
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected. Please try again.');
      return res.redirect(`/admin/blog/edit/${req.params.id}`);
    }
    
    const updateData = {
      ...req.body,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      status: req.body.status || 'published'
    };
    
    if (req.files && req.files['image']) {
      updateData.image = req.files['image'][0].filename;
    }
    
    if (req.files && req.files['video']) {
      updateData.video = req.files['video'][0].filename;
    }
    
    await Blog.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Blog post updated successfully!');
    res.redirect('/admin/blog');
    
  } catch (error) {
    console.error('Error updating blog post:', error);
    req.flash('error_msg', 'Error updating blog post: ' + error.message);
    res.redirect(`/admin/blog/edit/${req.params.id}`);
  }
};

// Add both POST and PUT routes for updates
router.put('/projects/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), updateProjectHandler);

router.post('/projects/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), updateProjectHandler);

router.put('/blog/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), updateBlogHandler);

router.post('/blog/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), updateBlogHandler);

// Delete project
router.post('/projects/delete/:id', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected');
      return res.redirect('/admin/projects');
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Project deleted successfully!');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Error deleting project:', error);
    req.flash('error_msg', 'Error deleting project');
    res.redirect('/admin/projects');
  }
});

// Delete blog post
router.post('/blog/delete/:id', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      req.flash('error_msg', 'Database not connected');
      return res.redirect('/admin/blog');
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Blog post deleted successfully!');
    res.redirect('/admin/blog');
  } catch (error) {
    console.error('Error deleting blog post:', error);
    req.flash('error_msg', 'Error deleting blog post');
    res.redirect('/admin/blog');
  }
});

// Contacts Management
router.get('/contacts', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.render('admin/manage-contacts', {
        title: 'Manage Contacts - Gelelcha Admin',
        adminName: req.session.adminName,
        contacts: [],
        currentPage: 'contacts',
        error_msg: 'Database not connected'
      });
    }
    
    const contacts = await Contact.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    
    res.render('admin/manage-contacts', {
      title: 'Manage Contacts - Gelelcha Admin',
      adminName: req.session.adminName,
      contacts: contacts,
      currentPage: 'contacts'
    });
  } catch (error) {
    console.error('Contacts page error:', error);
    res.render('admin/manage-contacts', {
      title: 'Manage Contacts - Gelelcha Admin',
      adminName: req.session.adminName,
      contacts: [],
      currentPage: 'contacts',
      error_msg: 'Error loading contacts'
    });
  }
});

// Volunteers Management
router.get('/volunteers', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.render('admin/manage-volunteers', {
        title: 'Manage Volunteers - Gelelcha Admin',
        adminName: req.session.adminName,
        volunteers: [],
        currentPage: 'volunteers',
        error_msg: 'Database not connected'
      });
    }
    
    const volunteers = await Volunteer.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    
    res.render('admin/manage-volunteers', {
      title: 'Manage Volunteers - Gelelcha Admin',
      adminName: req.session.adminName,
      volunteers: volunteers,
      currentPage: 'volunteers'
    });
  } catch (error) {
    console.error('Volunteers page error:', error);
    res.render('admin/manage-volunteers', {
      title: 'Manage Volunteers - Gelelcha Admin',
      adminName: req.session.adminName,
      volunteers: [],
      currentPage: 'volunteers',
      error_msg: 'Error loading volunteers'
    });
  }
});

// Donations Management
router.get('/donations', auth, async (req, res) => {
  try {
    if (!checkDBConnection()) {
      return res.render('admin/manage-donations', {
        title: 'Manage Donations - Gelelcha Admin',
        adminName: req.session.adminName,
        donations: [],
        currentPage: 'donations',
        error_msg: 'Database not connected'
      });
    }
    
    const donations = await Donation.find().sort({ createdAt: -1 }).maxTimeMS(5000);
    
    res.render('admin/manage-donations', {
      title: 'Manage Donations - Gelelcha Admin',
      adminName: req.session.adminName,
      donations: donations,
      currentPage: 'donations'
    });
  } catch (error) {
    console.error('Donations page error:', error);
    res.render('admin/manage-donations', {
      title: 'Manage Donations - Gelelcha Admin',
      adminName: req.session.adminName,
      donations: [],
      currentPage: 'donations',
      error_msg: 'Error loading donations'
    });
  }
});

// Admin logout
router.get('/logout', auth, (req, res) => {
  console.log('Logout:', req.session.adminName);
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;