const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Get all products from MongoDB with proper error handling
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching products from MongoDB...');

    const totalCount = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalCount}`);

    const { category, search, minPrice, maxPrice, sortBy } = req.query;
    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_low') sortOption = { price: 1 };
    if (sortBy === 'price_high') sortOption = { price: -1 };
    if (sortBy === 'rating') sortOption = { ratingsAverage: -1 };
    if (sortBy === 'name') sortOption = { name: 1 };

    console.log('🔍 Query:', query);
    console.log('🔄 Sort:', sortOption);

    const products = await Product.find(query).sort(sortOption);

    console.log(`✅ Found ${products.length} products matching criteria`);

    res.json({
      success: true,
      count: products.length,
      totalInDb: totalCount,
      products,
      query,
      message: products.length === 0 ? 'No products found matching criteria' : 'Products fetched successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error);

    res.status(500).json({
      success: false,
      count: 0,
      products: [],
      message: 'Error fetching products from database',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get products count for dashboard
router.get('/count', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ 'stock.quantity': { $lte: 5, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ 'stock.quantity': 0 });

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    console.error('❌ Error getting product count:', error);
    res.status(500).json({
      success: false,
      data: {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      },
      error: error.message
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching product:', req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
        product: null
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      console.log('❌ Product not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        product: null
      });
    }

    console.log('✅ Product found:', product.name);
    res.json({
      success: true,
      product,
      message: 'Product found successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      product: null,
      error: error.message
    });
  }
});

// Add product - Save to MongoDB (Admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    console.log('➕ Adding new product to MongoDB...');
    console.log('📝 Request body:', req.body);
    console.log('👤 User:', req.user?.email, '| Role:', req.user?.role);

    const {
      name,
      description,
      price,
      category,
      stock,
      image,
      featured,
      shortDescription,
      originalPrice,
      discount,
      specifications,
      benefits,
      tags
    } = req.body;

    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'description', 'price', 'category', 'stock'],
        received: Object.keys(req.body)
      });
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription || description.substring(0, 150) + '...',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : 0,
      category,
      stock: { quantity: parseInt(stock), trackInventory: true },
      images: [{ url: image || 'https://via.placeholder.com/400x400?text=Plant+Image', alt: '', isPrimary: true }],
      featured: Boolean(featured),
      specifications: specifications || {},
      benefits: Array.isArray(benefits)
        ? benefits
        : (typeof benefits === 'string'
          ? benefits.split(',').map(b => b.trim())
          : []),
      tags: Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
          ? tags.split(',').map(t => t.trim())
          : []),
      ratingsAverage: 0,
      ratingsQuantity: 0,
      isActive: true,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    };

    console.log('📋 Final product data:', productData);

    const product = new Product(productData);
    const savedProduct = await product.save();

    console.log('✅ Product saved successfully:', savedProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name or SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

module.exports = router;
