// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: { type: String, default: null },
  icon: { type: String, default: null },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  seoTitle: { type: String, trim: true, maxlength: [60, 'SEO title cannot exceed 60 characters'] },
  seoDescription: { type: String, trim: true, maxlength: [160, 'SEO description cannot exceed 160 characters'] },
  keywords: [{ type: String, trim: true }],
  featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  characteristics: {
    careLevel: { type: [String], enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    lightRequirement: { type: [String], enum: ['Low Light', 'Medium Light', 'Bright Indirect', 'Direct Sun'] },
    wateringFrequency: { type: [String], enum: ['Daily', 'Every 2-3 days', 'Weekly', 'Bi-weekly', 'Monthly'] },
    size: { type: [String], enum: ['Small', 'Medium', 'Large', 'Extra Large'] },
    petFriendly: { type: Boolean, default: null }
  },
  priceRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.virtual('subcategoryCount').get(function() {
  return this.subcategories ? this.subcategories.length : 0;
});

categorySchema.virtual('fullPath').get(function() {
  if (this.parentCategory && this.parentCategory.name) {
    return `${this.parentCategory.name} > ${this.name}`;
  }
  return this.name;
});

// Pre-save: create slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
      .trim();
  }
  next();
});

// Methods
categorySchema.methods.getAllSubcategories = async function() {
  const Category = this.constructor;

  async function getSubcategories(categoryId) {
    const subs = await Category.find({ parentCategory: categoryId });
    let allSubs = [...subs];
    for (const sub of subs) {
      const nested = await getSubcategories(sub._id);
      allSubs = allSubs.concat(nested);
    }
    return allSubs;
  }

  return await getSubcategories(this._id);
};

categorySchema.methods.getHierarchy = async function() {
  const Category = this.constructor;
  const hierarchy = [this];
  let current = this;
  while (current.parentCategory) {
    current = await Category.findById(current.parentCategory);
    if (current) hierarchy.unshift(current);
    else break;
  }
  return hierarchy;
};

// Statics
categorySchema.statics.getRootCategories = function() {
  return this.find({ parentCategory: null, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  const map = {};
  const tree = [];

  categories.forEach(cat => { map[cat._id] = { ...cat.toObject(), children: [] }; });
  categories.forEach(cat => {
    if (cat.parentCategory) {
      const parent = map[cat.parentCategory];
      if (parent) parent.children.push(map[cat._id]);
    } else {
      tree.push(map[cat._id]);
    }
  });

  return tree;
};

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
