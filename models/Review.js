const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for review']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for review']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false // Not all reviews need to be linked to orders
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [200, 'Review title cannot exceed 200 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      trim: true
    },
    caption: {
      type: String,
      trim: true
    }
  }],
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con cannot exceed 200 characters']
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReasons: [{
    type: String,
    enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other']
  }],
  helpfulVotes: {
    positive: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    negative: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  adminResponse: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  reviewerInfo: {
    location: {
      type: String,
      trim: true
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    }
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousContent: {
      title: String,
      comment: String,
      rating: Number
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpful score
reviewSchema.virtual('helpfulScore').get(function() {
  const positiveVotes = this.helpfulVotes.positive.length;
  const negativeVotes = this.helpfulVotes.negative.length;
  return positiveVotes - negativeVotes;
});

// Virtual for total votes
reviewSchema.virtual('totalVotes').get(function() {
  return this.helpfulVotes.positive.length + this.helpfulVotes.negative.length;
});

// Virtual for helpfulness percentage
reviewSchema.virtual('helpfulnessPercentage').get(function() {
  const total = this.totalVotes;
  if (total === 0) return 0;
  return Math.round((this.helpfulVotes.positive.length / total) * 100);
});

// Virtual for review age in days
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ createdAt: -1 });

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Check if this is a verified purchase
  if (this.order && !this.isVerifiedPurchase) {
    this.isVerifiedPurchase = true;
  }
  next();
});

// Post-save middleware to update product ratings
reviewSchema.post('save', async function() {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    if (product) {
      await product.updateRatings();
    }
  } catch (error) {
    console.error('Error updating product ratings:', error);
  }
});

// Post-remove middleware to update product ratings
reviewSchema.post('remove', async function() {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    if (product) {
      await product.updateRatings();
    }
  } catch (error) {
    console.error('Error updating product ratings after review removal:', error);
  }
});

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId, voteType = 'positive') {
  // Remove existing vote from both arrays
  this.helpfulVotes.positive = this.helpfulVotes.positive.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  this.helpfulVotes.negative = this.helpfulVotes.negative.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  
  // Add new vote
  if (voteType === 'positive') {
    this.helpfulVotes.positive.push({ user: userId });
  } else {
    this.helpfulVotes.negative.push({ user: userId });
  }
  
  return this.save();
};

// Method to remove helpful vote
reviewSchema.methods.removeHelpfulVote = function(userId) {
  this.helpfulVotes.positive = this.helpfulVotes.positive.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  this.helpfulVotes.negative = this.helpfulVotes.negative.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to check if user has voted
reviewSchema.methods.getUserVote = function(userId) {
  const positiveVote = this.helpfulVotes.positive.find(
    vote => vote.user.toString() === userId.toString()
  );
  const negativeVote = this.helpfulVotes.negative.find(
    vote => vote.user.toString() === userId.toString()
  );
  
  if (positiveVote) return 'positive';
  if (negativeVote) return 'negative';
  return null;
};

// Method to approve review
reviewSchema.methods.approve = function(adminId = null) {
  this.isApproved = true;
  if (adminId) {
    this.moderationNotes = `Approved by admin ${adminId} at ${new Date().toISOString()}`;
  }
  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = function(reason, adminId = null) {
  this.isApproved = false;
  this.moderationNotes = `Rejected by admin ${adminId || 'system'}: ${reason}`;
  return this.save();
};

// Method to report review
reviewSchema.methods.report = function(reason, reportedBy) {
  if (!this.reportReasons.includes(reason)) {
    this.reportReasons.push(reason);
  }
  this.isReported = true;
  return this.save();
};

// Method to add admin response
reviewSchema.methods.addAdminResponse = function(message, adminId) {
  this.adminResponse = {
    message,
    respondedBy: adminId,
    respondedAt: new Date()
  };
  return this.save();
};

// Static method to get reviews for a product
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    rating = null,
    verified = null
  } = options;
  
  const query = { 
    product: productId, 
    isApproved: true 
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  if (verified !== null) {
    query.isVerifiedPurchase = verified;
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName avatar')
    .populate('adminResponse.respondedBy', 'firstName lastName');
};

// Static method to get rating distribution for a product
reviewSchema.statics.getRatingDistribution = function(productId) {
  return this.aggregate([
    { 
      $match: { 
        product: mongoose.Types.ObjectId(productId), 
        isApproved: true 
      } 
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Static method to get reviews summary
reviewSchema.statics.getReviewsSummary = function(productId) {
  return this.aggregate([
    { 
      $match: { 
        product: mongoose.Types.ObjectId(productId), 
        isApproved: true 
      } 
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: {
            rating: '$rating',
            count: 1
          }
        },
        verifiedPurchases: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        }
      }
    }
  ]);
};

// Check if model already exists to prevent overwrite error
module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);