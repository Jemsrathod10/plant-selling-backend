const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/plant_selling_db');
    console.log('✅ Database connection successful!');
    console.log('📍 Database: plant_selling_db');
    console.log('🌐 Host: localhost:27017');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  }
};

testConnection();