const mongoose = require('mongoose');
const Blog = require('./models/Blog');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const fixBlogPosts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all draft posts to published
    const result = await Blog.updateMany(
      { status: 'draft' },
      { 
        status: 'published',
        publishedAt: new Date()
      }
    );

    console.log(`Updated ${result.modifiedCount} blog posts from draft to published`);

    // Verify the fix
    const publishedBlogs = await Blog.find({ status: 'published' });
    console.log(`Now have ${publishedBlogs.length} published blog posts`);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing blog posts:', error);
    process.exit(1);
  }
};

fixBlogPosts();