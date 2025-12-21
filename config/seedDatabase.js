const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Clear any existing models to avoid overwrite errors
Object.keys(mongoose.models).forEach(key => {
  delete mongoose.models[key];
});

// Import models after clearing
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');

// Utility: slugify text
const slugify = (text) =>
  text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')       
    .replace(/[^\w\-]+/g, '')   
    .replace(/\-\-+/g, '-');

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting Database Seeding...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/plant_selling_db');
    console.log('✅ Connected to MongoDB\n');

    // -------------------- Categories --------------------
    const categoriesData = [
      { name: 'Indoor Plants', description: 'Perfect plants for indoor spaces', isActive: true, sortOrder: 1 },
      { name: 'Outdoor Plants', description: 'Hardy plants for outdoor conditions', isActive: true, sortOrder: 2 },
      { name: 'Flowering Plants', description: 'Beautiful blooming plants', isActive: true, sortOrder: 3 },
      { name: 'Succulents', description: 'Low-maintenance plants', isActive: true, sortOrder: 4 },
      { name: 'Herbs', description: 'Fresh culinary and medicinal herbs', isActive: true, sortOrder: 5 },
      { name: 'Trees', description: 'Large plants and saplings', isActive: true, sortOrder: 6 }
    ];
    
    const categoriesWithSlug = categoriesData.map(c => ({ 
      ...c, 
      slug: slugify(c.name)
    }));
    
    // Insert categories if not exist
    const createdCategories = [];
    for (const cat of categoriesWithSlug) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const newCat = await Category.create(cat);
        createdCategories.push(newCat);
      } else {
        createdCategories.push(existing);
      }
    }
    console.log(`✅ Categories ready: ${createdCategories.length}\n`);

    const categoryMap = {};
    createdCategories.forEach(c => categoryMap[c.name] = c._id);

    // -------------------- Users --------------------
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    const usersData = [
      {
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@plantstore.com',
        password: adminPassword,
        role: 'admin',
        isAdmin: true,
        phone: '9876543210',
        profile: {
          phone: '9876543210',
          address: {
            street: '123 Admin Street',
            city: 'Surat',
            state: 'Gujarat',
            postalCode: '395007',
            country: 'India'
          }
        },
        address: { 
          street: '123 Admin Street', 
          city: 'Surat', 
          state: 'Gujarat', 
          zipCode: '395007', 
          country: 'India' 
        },
        dateOfBirth: new Date('1990-01-01'),
        isEmailVerified: true,
        emailVerified: true,
        isActive: true,
        lastLogin: new Date()
      },
      {
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: userPassword,
        role: 'customer',
        isAdmin: false,
        phone: '9876543211',
        profile: {
          phone: '9876543211',
          address: {
            street: '456 Customer Colony',
            city: 'Surat',
            state: 'Gujarat',
            postalCode: '395008',
            country: 'India'
          }
        },
        address: { 
          street: '456 Customer Colony', 
          city: 'Surat', 
          state: 'Gujarat', 
          zipCode: '395008', 
          country: 'India' 
        },
        dateOfBirth: new Date('1995-06-15'),
        isEmailVerified: true,
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: userPassword,
        role: 'customer',
        isAdmin: false,
        phone: '9876543212',
        profile: {
          phone: '9876543212',
          address: {
            street: '789 Plant Avenue',
            city: 'Surat',
            state: 'Gujarat',
            postalCode: '395009',
            country: 'India'
          }
        },
        address: { 
          street: '789 Plant Avenue', 
          city: 'Surat', 
          state: 'Gujarat', 
          zipCode: '395009', 
          country: 'India' 
        },
        dateOfBirth: new Date('1992-08-20'),
        isEmailVerified: true,
        emailVerified: true,
        isActive: true
      }
    ];

    const createdUsers = [];
    for (const userData of usersData) {
      let existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const newUser = await User.create(userData);
        createdUsers.push(newUser);
      } else {
        createdUsers.push(existing);
      }
    }
    console.log(`✅ Users ready: ${createdUsers.length}\n`);

    // -------------------- Products --------------------
    const productsData = [ /* your full productsData array here */ ];

    const createdProducts = [];
    for (const productData of productsData) {
      let existing = await Product.findOne({ sku: productData.sku });
      if (!existing) {
        const product = new Product(productData);
        const savedProduct = await product.save();
        createdProducts.push(savedProduct);
        console.log(`✅ Created product: ${productData.name}`);
      } else {
        createdProducts.push(existing);
        console.log(`ℹ️ Product already exists: ${productData.name}`);
      }
    }
    console.log(`\n✅ Products ready: ${createdProducts.length}\n`);

    // -------------------- Reviews --------------------
    const reviewsData = [];
    if (createdProducts.length > 0) {
      reviewsData.push({
        user: createdUsers[1]._id,
        product: createdProducts[0]._id,
        rating: 5,
        title: 'Amazing plant!',
        comment: 'Absolutely love my plant! It arrived in perfect condition and has been growing beautifully. The leaves are huge and the plant looks exactly like in the pictures.',
        pros: ['Beautiful leaves', 'Easy to care for', 'Fast shipping'],
        cons: [],
        isVerifiedPurchase: true,
        isApproved: true,
        reviewerInfo: {
          location: 'Surat, Gujarat',
          experienceLevel: 'beginner',
          wouldRecommend: true
        }
      });
    }

    const createdReviews = [];
    for (const reviewData of reviewsData) {
      const exists = await Review.findOne({ user: reviewData.user, product: reviewData.product, title: reviewData.title });
      if (!exists) {
        const review = new Review(reviewData);
        const savedReview = await review.save();
        createdReviews.push(savedReview);
        console.log(`✅ Created review for: ${reviewData.title}`);
      } else {
        createdReviews.push(exists);
        console.log(`ℹ️ Review already exists: ${reviewData.title}`);
      }
    }
    console.log(`\n✅ Reviews ready: ${createdReviews.length}\n`);

    // Update product ratings
    for (const product of createdProducts) {
      try {
        await product.updateRatings();
      } catch {}
    }

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
