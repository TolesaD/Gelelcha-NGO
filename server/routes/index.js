const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Blog = require('../models/Blog');

// Homepage
router.get('/', async (req, res) => {
  try {
    let featuredProjects = [];
    let latestBlogs = [];
    
    try {
      // Show ALL featured projects, not just ongoing ones
      featuredProjects = await Project.find({ isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(3)
        .maxTimeMS(10000)
        .catch(() => []);
    } catch (projectError) {
      console.log('Featured projects query failed:', projectError.message);
      featuredProjects = [];
    }
    
    try {
      latestBlogs = await Blog.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .maxTimeMS(10000)
        .catch(() => []);
    } catch (blogError) {
      console.log('Latest blogs query failed:', blogError.message);
      latestBlogs = [];
    }
    
    console.log(`Homepage: ${featuredProjects.length} featured projects, ${latestBlogs.length} blogs`);
    
    res.render('index', {
      title: 'Home - Gelelcha Charity',
      featuredProjects,
      latestBlogs
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.render('index', {
      title: 'Home - Gelelcha Charity',
      featuredProjects: [],
      latestBlogs: []
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