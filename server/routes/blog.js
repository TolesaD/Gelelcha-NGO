const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Public Blog page - show all published blog posts
router.get('/', async (req, res) => {
  try {
    console.log('Fetching blog posts...');
    const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
    
    console.log(`Found ${blogs.length} published blog posts`);
    
    res.render('blog', {
      title: 'Blog - Gelelcha Charity',
      blogs: blogs || []
    });
  } catch (error) {
    console.error('Blog page error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading blog page'
    });
  }
});

// Public Single blog post
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id, 
      status: 'published' 
    });
    
    if (!blog) {
      return res.status(404).render('error', {
        title: 'Blog Post Not Found',
        message: 'The blog post you are looking for does not exist or is not published.'
      });
    }
    
    // Increment view count
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    
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