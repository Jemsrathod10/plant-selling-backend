const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer','admin'], default: 'customer' },
  isAdmin: { type: Boolean, default: false },
  phone: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

// password hash
userSchema.pre('save', function(next){
  if(this.isModified('password') && !this.password.startsWith('$2a$')){
    const salt = bcrypt.genSaltSync(12);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword){
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.users || mongoose.model('users', userSchema);
