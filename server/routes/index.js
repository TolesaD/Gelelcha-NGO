const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog'); // Import Blog model

// Homepage
router.get('/', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Blog = require('../models/Blog');
    
    const featuredProjects = await Project.find({ isFeatured: true, status: 'ongoing' })
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Debug: Check what we're querying for
    console.log('=== HOMEPAGE BLOG QUERY ===');
    const publishedBlogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3);
    
    console.log('Published blogs query result:', {
      count: publishedBlogs.length,
      blogs: publishedBlogs.map(blog => ({
        title: blog.title,
        status: blog.status,
        id: blog._id
      }))
    });
    
    // Also check all blogs for debugging
    const allBlogs = await Blog.find().sort({ createdAt: -1 });
    console.log('All blogs:', {
      count: allBlogs.length,
      statuses: allBlogs.map(blog => blog.status)
    });
    
    res.render('index', {
      title: 'Home - Gelelcha Charity',
      featuredProjects,
      latestBlogs: publishedBlogs
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).render('error', { 
      title: 'Server Error',
      message: 'Error loading homepage' 
    });
  }
});

// About Us page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - Gelelcha Charity'
  });
});

module.exports = router;