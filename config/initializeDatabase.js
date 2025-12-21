const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Category = require('../models/Category');

const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/plant_selling_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});

    console.log('✅ Existing data cleared');

    // Create Categories
    console.log('📂 Creating categories...');
    const categories = [
      {
        name: 'Indoor Plants',
        description: 'Perfect plants for indoor spaces that purify air and add greenery to your home',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
        icon: '🏠',
        sortOrder: 1
      },
      {
        name: 'Outdoor Plants',
        description: 'Hardy plants that thrive in outdoor conditions and garden settings',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
        icon: '🌳',
        sortOrder: 2
      },
      {
        name: 'Flowering Plants',
        description: 'Beautiful blooming plants that add color and fragrance to any space',
        image: 'https://images.unsplash.com/photo-1441804238730-210ce2ef6d6b',
        icon: '🌸',
        sortOrder: 3
      },
      {
        name: 'Succulents',
        description: 'Low-maintenance plants perfect for beginners and busy lifestyles',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
        icon: '🌵',
        sortOrder: 4
      },
      {
        name: 'Herbs',
        description: 'Fresh culinary and medicinal herbs for your kitchen garden',
        image: 'https://images.unsplash.com/photo-1471194402553-de3187565620',
        icon: '🌿',
        sortOrder: 5
      },
      {
        name: 'Trees',
        description: 'Large plants and saplings that grow into beautiful trees',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        icon: '🌲',
        sortOrder: 6
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create Users
    console.log('👥 Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);
    const testUserPassword = await bcrypt.hash('test123', 12);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@plantshop.com',
        password: adminPassword,
        isAdmin: true,
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
        emailVerified: true
      },
      {
        name: 'Regular User',
        email: 'user@user.com',
        password: userPassword,
        isAdmin: false,
        profile: {
          phone: '9876543211',
          address: {
            street: '456 User Colony',
            city: 'Surat',
            state: 'Gujarat',
            postalCode: '395008',
            country: 'India'
          }
        },
        preferences: {
          favoriteCategories: ['Indoor', 'Succulent']
        },
        emailVerified: true
      },
      {
        name: 'Test Customer',
        email: 'test@test.com',
        password: testUserPassword,
        isAdmin: false,
        profile: {
          phone: '9876543212',
          address: {
            street: '789 Test Area',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
          }
        },
        emailVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create Products with detailed information
    console.log('🌱 Creating products...');
    const products = [
      {
        name: 'Monstera Deliciosa',
        description: 'A stunning tropical plant with large, perforated leaves that creates a dramatic statement in any room. Native to Central America, this climbing plant is known for its unique fenestrated leaves.',
        shortDescription: 'Stunning tropical plant with large, perforated leaves',
        price: 1250,
        originalPrice: 1500,
        discount: 17,
        category: 'Indoor',
        subCategory: 'Tropical',
        stock: 25,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=600',
            alt: 'Monstera Deliciosa main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Monstera deliciosa',
          family: 'Araceae',
          origin: 'Central America',
          size: {
            height: '6-10 feet indoors',
            spread: '3-5 feet'
          },
          growthRate: 'Fast',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Medium',
          soilType: 'Well-draining potting mix',
          temperature: '18-27°C',
          humidity: '60-80%',
          fertilizer: 'Monthly during growing season',
          toxicity: 'Toxic to Pets'
        },
        careInstructions: {
          watering: 'Water when top inch of soil is dry, typically every 1-2 weeks',
          lighting: 'Bright, indirect sunlight. Avoid direct sun which can scorch leaves',
          soil: 'Use well-draining potting mix with peat, perlite, and bark',
          temperature: 'Keep between 18-27°C, avoid cold drafts',
          humidity: 'Prefers high humidity (60-80%), mist regularly or use humidifier',
          fertilizing: 'Feed monthly with balanced liquid fertilizer during spring/summer',
          pruning: 'Trim yellow or damaged leaves, provide support for climbing',
          repotting: 'Repot every 2-3 years or when rootbound',
          commonIssues: ['Yellow leaves (overwatering)', 'Brown leaf tips (low humidity)', 'No fenestrations (insufficient light)']
        },
        benefits: ['Air purification', 'Dramatic foliage', 'Easy to propagate', 'Instagram-worthy'],
        tags: ['trending', 'air-purifier', 'large-leaves', 'tropical'],
        featured: true,
        rating: 4.8,
        numReviews: 24,
        seasonality: {
          bestPlantingTime: ['Spring', 'Summer'],
          floweringPeriod: 'Rarely flowers indoors'
        },
        createdBy: createdUsers[0]._id // Admin
      },
      {
        name: 'Snake Plant (Sansevieria Trifasciata)',
        description: 'An extremely hardy and low-maintenance plant known for its striking upright leaves with yellow edges. Perfect for beginners and excellent air purifier.',
        shortDescription: 'Hardy, low-maintenance plant perfect for beginners',
        price: 450,
        category: 'Indoor',
        subCategory: 'Low Light',
        stock: 45,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&w=600',
            alt: 'Snake Plant main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Sansevieria trifasciata',
          family: 'Asparagaceae',
          origin: 'West Africa',
          size: {
            height: '2-4 feet',
            spread: '1-2 feet'
          },
          growthRate: 'Slow',
          lightRequirement: 'Low Light',
          waterRequirement: 'Low',
          soilType: 'Well-draining cactus mix',
          temperature: '15-29°C',
          humidity: '30-50%',
          fertilizer: 'Rarely needed',
          toxicity: 'Toxic to Pets'
        },
        careInstructions: {
          watering: 'Water sparingly, every 2-3 weeks. Allow soil to dry completely',
          lighting: 'Tolerates low light but prefers indirect bright light',
          soil: 'Use cactus/succulent potting mix for good drainage',
          temperature: 'Thrives in normal room temperatures',
          humidity: 'Tolerates low humidity well',
          fertilizing: 'Feed once or twice during growing season',
          pruning: 'Remove damaged leaves at soil level',
          repotting: 'Repot every 3-5 years when rootbound',
          commonIssues: ['Root rot (overwatering)', 'Soft leaves (too much water)']
        },
        benefits: ['Excellent air purifier', 'NASA recommended', 'Releases oxygen at night', 'Very low maintenance'],
        tags: ['beginner-friendly', 'air-purifier', 'low-light', 'drought-tolerant'],
        featured: true,
        rating: 4.9,
        numReviews: 56,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Fiddle Leaf Fig',
        description: 'A popular statement plant with large, violin-shaped leaves. This trendy houseplant adds elegance and height to any interior space.',
        shortDescription: 'Statement plant with large, violin-shaped leaves',
        price: 2200,
        originalPrice: 2800,
        discount: 21,
        category: 'Indoor',
        subCategory: 'Statement Plants',
        stock: 12,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1556227834-09f1de7a7d14?ixlib=rb-4.0.3&w=600',
            alt: 'Fiddle Leaf Fig main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Ficus lyrata',
          family: 'Moraceae',
          origin: 'Western Africa',
          size: {
            height: '6-10 feet indoors',
            spread: '2-3 feet'
          },
          growthRate: 'Medium',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Medium',
          soilType: 'Well-draining potting soil',
          temperature: '18-24°C',
          humidity: '50-60%',
          toxicity: 'Toxic to Pets'
        },
        benefits: ['Architectural appeal', 'Instagram favorite', 'Air purifying'],
        tags: ['trendy', 'statement-plant', 'instagram-worthy'],
        featured: false,
        rating: 4.5,
        numReviews: 18,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Peace Lily',
        description: 'Beautiful flowering houseplant with elegant white blooms and glossy dark green leaves. Known for its ability to indicate watering needs.',
        shortDescription: 'Elegant flowering plant with white blooms',
        price: 650,
        category: 'Flowering',
        stock: 30,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1510411294649-cfb52ba4b7f3?ixlib=rb-4.0.3&w=600',
            alt: 'Peace Lily main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Spathiphyllum',
          family: 'Araceae',
          origin: 'Tropical Americas',
          lightRequirement: 'Medium Light',
          waterRequirement: 'Medium',
          toxicity: 'Toxic to Pets'
        },
        benefits: ['Air purification', 'Beautiful flowers', 'Easy care indicator'],
        tags: ['flowering', 'air-purifier', 'elegant'],
        featured: true,
        rating: 4.7,
        numReviews: 31,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Aloe Vera',
        description: 'Medicinal succulent plant with thick, fleshy leaves containing healing gel. Perfect for skincare and very easy to care for.',
        shortDescription: 'Medicinal succulent with healing properties',
        price: 280,
        category: 'Succulent',
        stock: 60,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1509423350716-97f2360af70e?ixlib=rb-4.0.3&w=600',
            alt: 'Aloe Vera main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Aloe barbadensis miller',
          family: 'Asphodelaceae',
          origin: 'Arabian Peninsula',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Low',
          toxicity: 'Non-toxic'
        },
        benefits: ['Medicinal properties', 'Skincare uses', 'Air purification', 'Easy propagation'],
        tags: ['medicinal', 'succulent', 'healing', 'easy-care'],
        featured: false,
        rating: 4.6,
        numReviews: 42,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Rubber Plant',
        description: 'Classic houseplant with glossy, thick leaves that grows into an impressive indoor tree. Very forgiving and adaptable.',
        shortDescription: 'Classic houseplant with glossy thick leaves',
        price: 850,
        category: 'Indoor',
        stock: 20,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1462947653521-178555d1d7db?ixlib=rb-4.0.3&w=600',
            alt: 'Rubber Plant main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Ficus elastica',
          family: 'Moraceae',
          origin: 'India',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Medium',
          toxicity: 'Toxic to Pets'
        },
        benefits: ['Air purification', 'Low maintenance', 'Classic appeal'],
        tags: ['classic', 'tree-like', 'glossy-leaves'],
        rating: 4.4,
        numReviews: 19,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Boston Fern',
        description: 'Lush, feathery fern perfect for hanging baskets or pedestals. Adds a tropical, forest-like feel to any space.',
        shortDescription: 'Lush, feathery fern perfect for hanging',
        price: 580,
        category: 'Indoor',
        stock: 25,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&w=600',
            alt: 'Boston Fern main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Nephrolepis exaltata',
          family: 'Nephrolepidaceae',
          origin: 'Tropical regions worldwide',
          lightRequirement: 'Medium Light',
          waterRequirement: 'High',
          toxicity: 'Pet Safe'
        },
        benefits: ['High humidity tolerance', 'Air humidification', 'Pet safe'],
        tags: ['fern', 'hanging', 'pet-safe', 'tropical'],
        rating: 4.3,
        numReviews: 15,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Lavender Plant',
        description: 'Fragrant herb perfect for outdoor gardens. Attracts beneficial insects and provides aromatic flowers for various uses.',
        shortDescription: 'Fragrant herb with beautiful purple flowers',
        price: 320,
        category: 'Herb',
        stock: 35,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&w=600',
            alt: 'Lavender Plant main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Lavandula angustifolia',
          family: 'Lamiaceae',
          origin: 'Mediterranean',
          lightRequirement: 'Direct Sunlight',
          waterRequirement: 'Low',
          toxicity: 'Pet Safe'
        },
        benefits: ['Aromatherapy', 'Insect repellent', 'Culinary uses', 'Attracts bees'],
        tags: ['fragrant', 'outdoor', 'herb', 'purple-flowers'],
        featured: true,
        rating: 4.8,
        numReviews: 67,
        seasonality: {
          bestPlantingTime: ['Spring'],
          floweringPeriod: 'Summer'
        },
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Jade Plant',
        description: 'Classic succulent with thick, fleshy leaves and tree-like structure. Symbol of good luck and prosperity in many cultures.',
        shortDescription: 'Lucky succulent with thick, fleshy leaves',
        price: 380,
        category: 'Succulent',
        stock: 40,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=600',
            alt: 'Jade Plant main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Crassula ovata',
          family: 'Crassulaceae',
          origin: 'South Africa',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Low',
          toxicity: 'Toxic to Pets'
        },
        benefits: ['Symbol of prosperity', 'Easy propagation', 'Long-lived'],
        tags: ['succulent', 'lucky-plant', 'tree-like'],
        rating: 4.5,
        numReviews: 33,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Basil Plant',
        description: 'Essential culinary herb with aromatic leaves perfect for cooking. Fresh basil adds flavor to many dishes.',
        shortDescription: 'Essential culinary herb for fresh cooking',
        price: 180,
        category: 'Herb',
        stock: 50,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1471194402553-de3187565620?ixlib=rb-4.0.3&w=600',
            alt: 'Basil Plant main image',
            isPrimary: true
          }
        ],
        specifications: {
          scientificName: 'Ocimum basilicum',
          family: 'Lamiaceae',
          origin: 'India',
          lightRequirement: 'Bright Light',
          waterRequirement: 'Medium',
          toxicity: 'Pet Safe'
        },
        benefits: ['Culinary use', 'Aromatic', 'Easy to grow', 'Continuous harvest'],
        tags: ['culinary', 'aromatic', 'kitchen-garden', 'edible'],
        rating: 4.9,
        numReviews: 78,
        seasonality: {
          bestPlantingTime: ['Spring', 'Summer'],
          harvestTime: 'Continuous'
        },
        createdBy: createdUsers[0]._id
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create Sample Reviews
    console.log('⭐ Creating sample reviews...');
    const reviews = [
      {
        user: createdUsers[1]._id,
        product: createdProducts[0]._id, // Monstera
        rating: 5,
        title: 'Amazing plant!',
        comment: 'Absolutely love my Monstera! It arrived in perfect condition and has been thriving. The leaves are huge and beautiful.',
        verified: true
      },
      {
        user: createdUsers[2]._id,
        product: createdProducts[0]._id, // Monstera
        rating: 4,
        title: 'Great quality',
        comment: 'Good size plant, well packaged. Growing nicely in my living room.',
        verified: true
      },
      {
        user: createdUsers[1]._id,
        product: createdProducts[1]._id, // Snake Plant
        rating: 5,
        title: 'Perfect for beginners',
        comment: 'This is my first plant and it is so easy to care for. Highly recommended for beginners!',
        verified: true
      },
      {
        user: createdUsers[2]._id,
        product: createdProducts[3]._id, // Peace Lily
        rating: 5,
        title: 'Beautiful flowers',
        comment: 'The flowers are gorgeous and it really does tell you when it needs water. Love it!',
        verified: true
      }
    ];

    const createdReviews = await Review.insertMany(reviews);
    console.log(`✅ Created ${createdReviews.length} reviews`);

    // Create Sample Orders
    console.log('📦 Creating sample orders...');
    const orders = [
      {
        user: createdUsers[1]._id,
        orderItems: [
          {
            product: createdProducts[0]._id,
            name: createdProducts[0].name,
            image: createdProducts[0].image,
            price: createdProducts[0].price,
            qty: 1,
            total: createdProducts[0].price
          },
          {
            product: createdProducts[1]._id,
            name: createdProducts[1].name,
            image: createdProducts[1].image,
            price: createdProducts[1].price,
            qty: 2,
            total: createdProducts[1].price * 2
          }
        ],
        shippingAddress: {
          firstName: 'Regular',
          lastName: 'User',
          email: 'user@user.com',
          phone: '9876543211',
          address: '456 User Colony',
          city: 'Surat',
          state: 'Gujarat',
          postalCode: '395008',
          country: 'India'
        },
        paymentMethod: 'UPI',
        pricing: {
          itemsPrice: 1250 + (450 * 2),
          taxPrice: (1250 + 900) * 0.18,
          shippingPrice: 0,
          totalPrice: 0
        },
        orderStatus: 'Delivered',
        isPaid: true,
        isDelivered: true,
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        user: createdUsers[2]._id,
        orderItems: [
          {
            product: createdProducts[3]._id,
            name: createdProducts[3].name,
            image: createdProducts[3].image,
            price: createdProducts[3].price,
            qty: 1,
            total: createdProducts[3].price
          }
        ],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@test.com',
          phone: '9876543212',
          address: '789 Test Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        paymentMethod: 'Credit Card',
        pricing: {
          itemsPrice: 650,
          taxPrice: 650 * 0.18,
          shippingPrice: 50,
          totalPrice: 0
        },
        orderStatus: 'Shipped',
        isPaid: true,
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Created ${createdOrders.length} sample orders`);

    // Display database statistics
    console.log('\n📊 Database Statistics:');
    console.log('========================');
    console.log(`Categories: ${await Category.countDocuments()}`);
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Products: ${await Product.countDocuments()}`);
    console.log(`Reviews: ${await Review.countDocuments()}`);
    console.log(`Orders: ${await Order.countDocuments()}`);

    console.log('\n🔑 Login Credentials:');
    console.log('=====================');
    console.log('Admin: admin@plantshop.com / admin123');
    console.log('User: user@user.com / user123');
    console.log('Test: test@test.com / test123');

    console.log('\n✅ Database initialization completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initializeDatabase();
