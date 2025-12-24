// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     console.log('🔄 Connecting to MongoDB...');
//     const conn = await mongoose.connect('mongodb://localhost:27017/plant_selling_db', {
//       autoIndex: true
//     });
//     console.log('✅ MongoDB Connected Successfully!');
//     console.log(`📍 Database: ${conn.connection.name}`);
//     console.log(`🌐 Host: ${conn.connection.host}:${conn.connection.port}`);
//   } catch (error) {
//     console.error('❌ MongoDB Connection Failed:', error.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected:', conn.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

