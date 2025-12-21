const mongoose = require('mongoose');

const clearDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/plant-selling-website');
    console.log('🔗 Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`✅ Cleared collection: ${collection.collectionName}`);
    }

    await mongoose.connection.close();
    console.log('✅ Database completely cleared!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
