const mongoose = require('mongoose');

const getStats = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/plant_selling_db');
    console.log('🔗 Connected to MongoDB');
    
    const User = require('./models/User');
    const Product = require('./models/Product');
    const Order = require('./models/Order');
    const Review = require('./models/Review');
    
    const [users, products, orders, reviews] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(), 
      Order.countDocuments(),
      Review.countDocuments()
    ]);
    
    console.log('📊 Database Statistics:');
    console.log('====================');
    console.log('👥 Users:', users);
    console.log('🌱 Products:', products);
    console.log('📦 Orders:', orders);
    console.log('⭐ Reviews:', reviews);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
    process.exit(1);
  }
};

getStats();