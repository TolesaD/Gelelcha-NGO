const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = './public/uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Simple auth middleware
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
    title: 'Admin Login - Gelelcha Charity'
  });
});

// Admin login processing
router.post('/login', [
  check('username', 'Username is required').notEmpty(),
  check('password', 'Password is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/login', {
      title: 'Admin Login - Gelelcha Charity',
      error_msg: 'Please fill in all fields',
      errors: errors.array()
    });
  }

  const { username, password } = req.body;
  console.log('Login attempt:', { username });

  try {
    const admin = await Admin.findOne({ username, isActive: true });
    
    if (!admin) {
      console.log('Admin not found or inactive:', username);
      return res.render('admin/login', {
        title: 'Admin Login - Gelelcha Charity',
        error_msg: 'Invalid credentials or account disabled'
      });
    }

    console.log('Admin found:', admin.username, admin.email);
    
    const isMatch = await admin.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      admin.lastLogin = new Date();
      await admin.save();
      
      req.session.admin = true;
      req.session.adminId = admin._id;
      req.session.adminRole = admin.role;
      req.session.adminName = admin.username;
      
      console.log('Login successful for:', admin.username);
      req.flash('success_msg', `Welcome back, ${admin.username}!`);
      return res.redirect('/admin/dashboard');
    } else {
      console.log('Password mismatch for:', username);
      return res.render('admin/login', {
        title: 'Admin Login - Gelelcha Charity',
        error_msg: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', {
      title: 'Admin Login - Gelelcha Charity',
      error_msg: 'Server error during login'
    });
  }
});

// Admin dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Donation = require('../models/Donation');
    const Volunteer = require('../models/Volunteer');
    const Blog = require('../models/Blog');
    const Contact = require('../models/Contact');
    
    const projectCount = await Project.countDocuments();
    const donationCount = await Donation.countDocuments();
    const volunteerCount = await Volunteer.countDocuments();
    const blogCount = await Blog.countDocuments();
    const contactCount = await Contact.countDocuments();
    
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
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading dashboard'
    });
  }
});

// Admin Projects Management
router.get('/projects', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.render('admin/manage-projects', {
      title: 'Manage Projects - Gelelcha Admin',
      adminName: req.session.adminName,
      projects: projects || [],
      currentPage: 'projects'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading projects'
    });
  }
});

// Admin Donations Management
router.get('/donations', auth, async (req, res) => {
  try {
    const Donation = require('../models/Donation');
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    res.render('admin/manage-donations', {
      title: 'Manage Donations - Gelelcha Admin',
      adminName: req.session.adminName,
      donations,
      currentPage: 'donations'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading donations'
    });
  }
});

// Admin Volunteers Management
router.get('/volunteers', auth, async (req, res) => {
  try {
    const Volunteer = require('../models/Volunteer');
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    
    res.render('admin/manage-volunteers', {
      title: 'Manage Volunteers - Gelelcha Admin',
      adminName: req.session.adminName,
      volunteers,
      currentPage: 'volunteers'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading volunteers'
    });
  }
});

// Admin Blog Management
router.get('/blog', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    const blogs = await Blog.find().sort({ createdAt: -1 });
    
    res.render('admin/manage-blog', {
      title: 'Manage Blog - Gelelcha Admin',
      adminName: req.session.adminName,
      blogs: blogs || [],
      currentPage: 'blog'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading blog posts'
    });
  }
});

// Admin Contacts Management
router.get('/contacts', auth, async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.render('admin/manage-contacts', {
      title: 'Manage Contacts - Gelelcha Admin',
      adminName: req.session.adminName,
      contacts,
      currentPage: 'contacts'
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading contacts'
    });
  }
});

// Add New Project - Form
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

// Edit Project - Form
router.get('/projects/edit/:id', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      req.flash('error_msg', 'Project not found');
      return res.redirect('/admin/projects');
    }
    
    res.render('admin/project-form', {
      title: 'Edit Project - Gelelcha Admin',
      adminName: req.session.adminName,
      currentPage: 'projects',
      project,
      formAction: `/admin/projects/${project._id}`,
      formMethod: 'POST'
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading project');
    res.redirect('/admin/projects');
  }
});

// Create Project
router.post('/projects', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const formData = {
      ...req.body,
      isFeatured: req.body.isFeatured === 'on'
    };
    
    if (req.files && req.files['image']) {
      formData.image = req.files['image'][0].filename;
    }
    
    if (req.files && req.files['video']) {
      formData.video = req.files['video'][0].filename;
    }
    
    const project = new Project(formData);
    await project.save();
    
    req.flash('success_msg', 'Project created successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Error creating project:', error);
    req.flash('error_msg', 'Error creating project: ' + error.message);
    res.redirect('/admin/projects/new');
  }
});

// Update Project
router.post('/projects/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const Project = require('../models/Project');
    
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
    
    req.flash('success_msg', 'Project updated successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Error updating project:', error);
    req.flash('error_msg', 'Error updating project: ' + error.message);
    res.redirect(`/admin/projects/edit/${req.params.id}`);
  }
});

// Delete Project
router.post('/projects/delete/:id', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    await Project.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Project deleted successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting project');
    res.redirect('/admin/projects');
  }
});

// Toggle Project Feature Status
router.post('/projects/feature/:id', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.id);
    project.isFeatured = !project.isFeatured;
    await project.save();
    
    req.flash('success_msg', `Project ${project.isFeatured ? 'featured' : 'unfeatured'} successfully`);
    res.redirect('/admin/projects');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating project');
    res.redirect('/admin/projects');
  }
});

// Add New Blog Post - Form
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

// Edit Blog Post - Form
router.get('/blog/edit/:id', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    const blog = await Blog.findById(req.params.id);
    
    res.render('admin/blog-form', {
      title: 'Edit Blog Post - Gelelcha Admin',
      adminName: req.session.adminName,
      currentPage: 'blog',
      blog,
      formAction: `/admin/blog/${blog._id}`,
      formMethod: 'POST'
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading blog post');
    res.redirect('/admin/blog');
  }
});

// Create Blog Post (FIXED - This is the only create route)
router.post('/blog', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== BLOG CREATION ===');
    console.log('Request body:', req.body);
    
    const Blog = require('../models/Blog');
    
    const blogData = {
      ...req.body,
      author: req.session.adminName,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      // Ensure status is properly set
      status: req.body.status || 'published'
    };
    
    console.log('Blog data with status:', blogData.status);
    
    if (req.files && req.files['image']) {
      blogData.image = req.files['image'][0].filename;
    }
    
    if (req.files && req.files['video']) {
      blogData.video = req.files['video'][0].filename;
    }
    
    const blog = new Blog(blogData);
    await blog.save();
    
    console.log('Blog saved with status:', blog.status);
    req.flash('success_msg', 'Blog post created successfully');
    res.redirect('/admin/blog');
  } catch (error) {
    console.error('Error creating blog post:', error);
    req.flash('error_msg', 'Error creating blog post: ' + error.message);
    res.redirect('/admin/blog/new');
  }
});

// Update Blog Post (FIXED - This is the only update route)
router.post('/blog/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    
    const updateData = {
      ...req.body,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      // Ensure status is properly handled
      status: req.body.status || 'published'
    };
    
    if (req.files && req.files['image']) {
      updateData.image = req.files['image'][0].filename;
    }
    
    if (req.files && req.files['video']) {
      updateData.video = req.files['video'][0].filename;
    }
    
    await Blog.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Blog post updated successfully');
    res.redirect('/admin/blog');
  } catch (error) {
    console.error('Error updating blog post:', error);
    req.flash('error_msg', 'Error updating blog post: ' + error.message);
    res.redirect(`/admin/blog/edit/${req.params.id}`);
  }
});

// Publish Blog Post
router.post('/blog/publish/:id', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    await Blog.findByIdAndUpdate(req.params.id, {
      status: 'published',
      publishedAt: new Date()
    });
    
    req.flash('success_msg', 'Blog post published successfully');
    res.redirect('/admin/blog');
  } catch (error) {
    console.error('Error publishing blog post:', error);
    req.flash('error_msg', 'Error publishing blog post');
    res.redirect('/admin/blog');
  }
});

// Delete Blog Post
router.post('/blog/delete/:id', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    await Blog.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Blog post deleted successfully');
    res.redirect('/admin/blog');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting blog post');
    res.redirect('/admin/blog');
  }
});

// Force publish all draft blogs
router.get('/blog/force-publish-all', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    const result = await Blog.updateMany(
      { status: { $ne: 'published' } },
      { 
        status: 'published',
        publishedAt: new Date()
      }
    );
    
    console.log('Force published blogs:', result);
    req.flash('success_msg', `Force published ${result.modifiedCount} blog posts`);
    res.redirect('/admin/blog');
  } catch (error) {
    console.error('Error force publishing:', error);
    req.flash('error_msg', 'Error force publishing blogs');
    res.redirect('/admin/blog');
  }
});

// Debug route to check blog posts
router.get('/debug/blogs', auth, async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    const allBlogs = await Blog.find().sort({ createdAt: -1 });
    const publishedBlogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
    
    res.json({
      allBlogs: allBlogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        status: blog.status,
        createdAt: blog.createdAt,
        publishedAt: blog.publishedAt
      })),
      publishedBlogs: publishedBlogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        status: blog.status
      })),
      counts: {
        all: allBlogs.length,
        published: publishedBlogs.length,
        draft: allBlogs.length - publishedBlogs.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin logout
router.get('/logout', auth, (req, res) => {
  console.log('Logout:', req.session.adminName);
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;