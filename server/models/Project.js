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
    type: String
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
  endDate: Date,
  targetAmount: Number,
  raisedAmount: {
    type: Number,
    default: 0
  },
  donors: {
    type: Number,
    default: 0
  },
  impact: {
    beneficiaries: Number,
    locations: [String]
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  gallery: [String],
  videos: [String]
}, {
  timestamps: true
});

// Better checkbox handling
projectSchema.pre('save', function(next) {
  // Handle checkbox value conversion
  if (this.isModified('isFeatured')) {
    if (typeof this.isFeatured === 'string') {
      this.isFeatured = this.isFeatured === 'on';
    } else if (typeof this.isFeatured === 'undefined') {
      this.isFeatured = false;
    }
  }
  next();
});

// Add static method for better validation
projectSchema.statics.safeCreate = function(data) {
  const project = new this(data);
  return project.validate().then(() => project);
};

module.exports = mongoose.model('Project', projectSchema);