const mongoose = require('mongoose');
const connectDB = require('./database');
const Category = require('../models/Category');

const seedCategories = async () => {
  try {
    await connectDB();

    const categories = [
      { name: 'Indoor Plants', description: 'Plants suitable for indoors' },
      { name: 'Outdoor Plants', description: 'Plants suitable for outdoors' },
      { name: 'Flowering Plants', description: 'Plants that produce flowers' },
      { name: 'Succulents', description: 'Low maintenance succulents' },
      { name: 'Herbs', description: 'Medicinal and culinary herbs' },
      { name: 'Trees', description: 'Large plants and trees' }
    ];

    for (let cat of categories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create(cat);
        console.log(`✅ Inserted category: ${cat.name}`);
      } else {
        console.log(`ℹ️ Category already exists: ${cat.name}`);
      }
    }

    console.log('🎉 Categories seeding completed!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding categories:', err);
    process.exit(1);
  }
};

seedCategories();
