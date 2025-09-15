const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Public Blog page - show all published blog posts
router.get('/', async (req, res) => {
  try {
    let blogs = [];
    
    try {
      blogs = await Blog.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .maxTimeMS(10000) // 10 second timeout
        .catch(() => []); // Return empty array on timeout
    } catch (error) {
      console.log('Blogs query failed:', error.message);
      blogs = [];
    }
    
    console.log(`Found ${blogs.length} published blog posts`);
    
    res.render('blog', {
      title: 'Blog - Gelelcha Charity',
      blogs: blogs
    });
  } catch (error) {
    console.error('Blog page error:', error);
    // Render the page even with errors
    res.render('blog', {
      title: 'Blog - Gelelcha Charity',
      blogs: []
    });
  }
});

// Public Single blog post
router.get('/:id', async (req, res) => {
  try {
    let blog = null;
    
    try {
      blog = await Blog.findOne({ 
        _id: req.params.id, 
        status: 'published' 
      })
      .maxTimeMS(10000) // 10 second timeout
      .catch(() => null); // Return null on timeout
    } catch (error) {
      console.log('Blog post query failed:', error.message);
      blog = null;
    }
    
    if (!blog) {
      return res.status(404).render('error', {
        title: 'Blog Post Not Found',
        message: 'The blog post you are looking for does not exist or is not published.'
      });
    }
    
    // Increment view count
    try {
      blog.views = (blog.views || 0) + 1;
      await blog.save();
    } catch (saveError) {
      console.log('Failed to update view count:', saveError.message);
      // Continue anyway - this isn't critical
    }
    
    res.render('blog-post', {
      title: blog.title + ' - Gelelcha Charity',
      blog
    });
  } catch (error) {
    console.error('Blog post error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading blog post'
    });
  }
});

module.exports = router;