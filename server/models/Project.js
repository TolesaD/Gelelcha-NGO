const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 150
  },
  image: {
    type: String,
    default: 'default-project.jpg'
  },
  video: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'upcoming'],
    default: 'ongoing'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  targetAmount: {
    type: Number,
    default: 0
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  donors: {
    type: Number,
    default: 0
  },
  impact: {
    beneficiaries: {
      type: Number,
      default: 0
    },
    locations: [{
      type: String,
      default: []
    }]
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  gallery: [{
    type: String,
    default: []
  }],
  videos: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true
});

// Handle checkbox value conversion
projectSchema.pre('save', function(next) {
  // Convert string 'on' to boolean true, undefined to false
  if (this.isFeatured === 'on') {
    this.isFeatured = true;
  } else if (this.isFeatured === undefined || this.isFeatured === null) {
    this.isFeatured = false;
  }
  
  // Set default values for other optional fields
  if (!this.video) this.video = '';
  if (!this.endDate) this.endDate = null;
  if (!this.impact) this.impact = { beneficiaries: 0, locations: [] };
  if (!this.gallery) this.gallery = [];
  if (!this.videos) this.videos = [];
  
  next();
});

// Add query method with timeout handling
projectSchema.statics.findWithTimeout = function(conditions = {}, options = {}) {
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

module.exports = mongoose.model('Project', projectSchema);