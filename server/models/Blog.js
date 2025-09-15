const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  image: {
    type: String,
    default: 'default-blog.jpg'
  },
  video: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Admin'
  },
  tags: [{
    type: String,
    default: []
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Set default values
blogSchema.pre('save', function(next) {
  if (!this.video) this.video = '';
  if (!this.tags) this.tags = [];
  
  // Create excerpt from content if not provided
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200) + (this.content.length > 200 ? '...' : '');
  }
  
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  } else if (this.status !== 'published') {
    this.publishedAt = null;
  }
  
  next();
});

// Add query method with timeout handling
blogSchema.statics.findWithTimeout = function(conditions = {}, options = {}) {
  const query = this.find(conditions);
  if (options.timeout) {
    query.maxTimeMS(options.timeout);
  }
  if (options.limit) {
    query.limit(options.limit);
  }
  if (options.sort) {
    query.sort(options.sort);
  }
  return query;
};

// Export the model properly
module.exports = mongoose.model('Blog', blogSchema);