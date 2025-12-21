const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  sku: { type: String, unique: true, uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: {
    type: [{ url: String, alt: String, isPrimary: Boolean }],
    validate: [arr => arr.length > 0, 'At least one image is required']
  },
  stock: { quantity: { type: Number, min: 0 }, trackInventory: { type: Boolean, default: true } },
  plantCare: {
    lightRequirement: { type: String, enum: ['Low Light','Medium Light','Bright Indirect','Direct Sun'], required: true },
    wateringFrequency: { type: String, enum: ['Daily','Every 2-3 days','Weekly','Bi-weekly','Monthly'], required: true },
    difficulty: { type: String, enum: ['Beginner','Intermediate','Advanced','Expert'], default: 'Beginner' },
    humidity: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
    temperature: { min: Number, max: Number },
    petFriendly: { type: Boolean, default: false },
    airPurifying: { type: Boolean, default: false }
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  isActive: { type: Boolean, default: true },
  ratingsAverage: { type: Number, default: 0 },
  ratingsQuantity: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.stock.quantity > 0;
});

productSchema.pre('save', function(next) {
  if(this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  }
  if(!this.sku && this.isNew) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2,5);
    this.sku = `PLT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
