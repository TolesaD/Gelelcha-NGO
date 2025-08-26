const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Debug route to check all blog posts
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    
    console.log('=== BLOG POSTS DEBUG ===');
    console.log(`Total blogs: ${blogs.length}`);
    
    blogs.forEach(blog => {
      console.log('---');
      console.log(`Title: ${blog.title}`);
      console.log(`Status: ${blog.status}`);
      console.log(`Created: ${blog.createdAt}`);
      console.log(`Published: ${blog.publishedAt}`);
      console.log(`ID: ${blog._id}`);
    });
    
    res.json({
      total: blogs.length,
      blogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        status: blog.status,
        createdAt: blog.createdAt,
        publishedAt: blog.publishedAt,
        views: blog.views
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;