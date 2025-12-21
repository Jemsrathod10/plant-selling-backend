const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['customer','admin'], default: 'customer' },
  isAdmin: { type: Boolean, default: false },
  avatar: { type: String, default: null },
  profile: {
    phone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' }
    },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  dateOfBirth: { type: Date },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
  return this.name || 'Unknown User';
});

// Pre-save hook
userSchema.pre('save', function(next) {
  // Sync role and isAdmin
  if (this.isModified('role')) this.isAdmin = this.role === 'admin';
  else if (this.isModified('isAdmin')) this.role = this.isAdmin ? 'admin' : 'customer';

  // Sync email verification
  if (this.isModified('emailVerified')) this.isEmailVerified = this.emailVerified;
  else if (this.isModified('isEmailVerified')) this.emailVerified = this.isEmailVerified;

  // Hash password
  if (this.isModified('password') && !this.password.startsWith('$2a$')) {
    const salt = bcrypt.genSaltSync(12);
    this.password = bcrypt.hashSync(this.password, salt);
  }

  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add to cart method
userSchema.methods.addToCart = function(productId, quantity = 1) {
  const existingItemIndex = this.cart.findIndex(item => item.product.toString() === productId.toString());
  if (existingItemIndex >= 0) this.cart[existingItemIndex].quantity += quantity;
  else this.cart.push({ product: productId, quantity });
  return this.save();
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
