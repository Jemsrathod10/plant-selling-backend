const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Import models (with better error handling and fallback)
let Order, User, Product;
try {
  // Try multiple possible paths for models
  try {
    Order = require('../models/Order');
  } catch (e1) {
    try {
      Order = require('./models/Order');
    } catch (e2) {
      try {
        Order = require('../../models/Order');
      } catch (e3) {
        console.error('❌ Could not find Order model in any expected location');
        throw new Error('Order model not found');
      }
    }
  }

  try {
    User = require('../models/User');
  } catch (e1) {
    try {
      User = require('./models/User');
    } catch (e2) {
      try {
        User = require('../../models/User');
      } catch (e3) {
        console.error('❌ Could not find User model in any expected location');
        throw new Error('User model not found');
      }
    }
  }

  try {
    Product = require('../models/Product');
  } catch (e1) {
    try {
      Product = require('./models/Product');
    } catch (e2) {
      try {
        Product = require('../../models/Product');
      } catch (e3) {
        console.error('❌ Could not find Product model in any expected location');
        throw new Error('Product model not found');
      }
    }
  }
  
  // Verify models are actually loaded and have required methods
  if (!Order || typeof Order.find !== 'function') {
    throw new Error('Order model failed to load or is not a valid Mongoose model');
  }
  if (!User || typeof User.find !== 'function') {
    throw new Error('User model failed to load or is not a valid Mongoose model');
  }
  if (!Product || typeof Product.find !== 'function') {
    throw new Error('Product model failed to load or is not a valid Mongoose model');
  }
  
  console.log('✅ All models loaded successfully');
  console.log('✅ Order.find type:', typeof Order.find);
  console.log('✅ User.find type:', typeof User.find);
  console.log('✅ Product.find type:', typeof Product.find);
} catch (error) {
  console.error('❌ CRITICAL: Error importing models:', error.message);
  console.error('Full error:', error);
  console.error('Current working directory:', process.cwd());
  console.error('Available models check:');
  
  // List available files for debugging
  const fs = require('fs');
  const path = require('path');
  
  try {
    const modelsPath = path.join(__dirname, '../models');
    const files = fs.readdirSync(modelsPath);
    console.log('Files in models directory:', files);
  } catch (fsError) {
    console.log('Could not read models directory');
  }
  
  // Don't exit process, instead create mock models for development
  console.log('🚨 Creating mock models to prevent crash...');
  
  // Create minimal mock models that will return empty results
  const mockSchema = new mongoose.Schema({});
  Order = mongoose.model('Order_Mock', mockSchema);
  User = mongoose.model('User_Mock', mockSchema);
  Product = mongoose.model('Product_Mock', mockSchema);
  
  console.log('⚠️  WARNING: Using mock models - your data operations will not work correctly!');
}

// Import auth middleware
let auth;
try {
  auth = require('../middleware/auth');
} catch (authError) {
  console.error('❌ Error importing auth middleware:', authError.message);
  // Create a mock auth middleware
  auth = () => (req, res, next) => {
    req.user = { _id: 'mock_user', isAdmin: true, role: 'admin' };
    next();
  };
}

console.log('📦 Orders routes loaded successfully');

// Add logging middleware
router.use((req, res, next) => {
  console.log(`\n🔍 Orders API: ${req.method} ${req.originalUrl}`);
  console.log(`🔑 Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

// Admin-only middleware with better error handling
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in admin authentication' 
    });
  }
};

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({
    success: true,
    message: 'Orders API is working!',
    timestamp: new Date().toISOString(),
    modelsLoaded: {
      Order: !!Order && typeof Order.find === 'function',
      User: !!User && typeof User.find === 'function',
      Product: !!Product && typeof Product.find === 'function'
    },
    modelTypes: {
      Order: typeof Order,
      User: typeof User,
      Product: typeof Product
    },
    orderFindType: typeof Order?.find,
    currentDirectory: process.cwd()
  });
});

// GET user's orders - MAIN ENDPOINT CAUSING ERROR
router.get('/myorders', auth(), async (req, res) => {
  try {
    console.log('📋 Fetching orders for user:', req.user._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication failed',
        orders: [] 
      });
    }

    // Verify Order model is available
    if (!Order || typeof Order.find !== 'function') {
      console.error('❌ Order model not available in /myorders');
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not available',
        orders: [] 
      });
    }

    // Find orders for the user
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`📦 Found ${orders.length} orders for user`);

    // Process each order to populate product details safely
    const processedOrders = [];
    
    for (let order of orders) {
      try {
        // Ensure order has required fields
        if (!order.items) order.items = [];
        
        // Process items with error handling
        const processedItems = [];
        for (let item of order.items) {
          try {
            let productDetails = null;
            if (item.product && Product && typeof Product.findById === 'function') {
              productDetails = await Product.findById(item.product)
                .select('name images slug price')
                .lean()
                .exec();
            }
            
            processedItems.push({
              ...item,
              product: productDetails,
              // Fallback values
              name: item.name || productDetails?.name || 'Unknown Product',
              price: item.price || productDetails?.price || 0,
              quantity: item.quantity || 1,
              image: item.image || productDetails?.images?.[0]?.url || '/placeholder-product.jpg'
            });
          } catch (itemError) {
            console.warn('Error processing item:', itemError.message);
            // Include item even if product lookup fails
            processedItems.push({
              ...item,
              product: null,
              name: item.name || 'Unknown Product',
              price: item.price || 0,
              quantity: item.quantity || 1,
              image: item.image || '/placeholder-product.jpg'
            });
          }
        }

        // Add processed order
        processedOrders.push({
          ...order,
          items: processedItems,
          // Ensure required fields exist
          orderNumber: order.orderNumber || `ORD-${order._id?.toString().slice(-8)}`,
          status: order.status || 'pending',
          pricing: order.pricing || { total: 0 },
          payment: order.payment || { method: 'cod', status: 'pending' }
        });
        
      } catch (orderError) {
        console.warn('Error processing order:', orderError.message);
        // Include basic order even if processing fails
        processedOrders.push({
          ...order,
          items: order.items || [],
          orderNumber: order.orderNumber || `ORD-${order._id?.toString().slice(-8)}`,
          status: order.status || 'pending',
          pricing: order.pricing || { total: 0 },
          payment: order.payment || { method: 'cod', status: 'pending' }
        });
      }
    }

    console.log(`✅ Successfully processed ${processedOrders.length} orders`);

    res.json({ 
      success: true, 
      count: processedOrders.length,
      orders: processedOrders || [] 
    });

  } catch (error) {
    console.error('❌ Error in /myorders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user orders: ' + error.message,
      orders: [] 
    });
  }
});

// GET all orders (admin only)
router.get('/', auth(), adminOnly, async (req, res) => {
  try {
    console.log('👨‍💼 Admin fetching all orders');
    
    // Verify Order model is available
    if (!Order || typeof Order.find !== 'function') {
      console.error('❌ Order model not available in admin route');
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not available',
        orders: [] 
      });
    }
    
    const { status, limit = 50, page = 1 } = req.query;
    
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
      .exec();

    // Process orders safely
    const processedOrders = [];
    for (let order of orders) {
      try {
        // Get user details
        let userDetails = null;
        if (order.user && User && typeof User.findById === 'function') {
          userDetails = await User.findById(order.user)
            .select('name email firstName lastName')
            .lean()
            .exec();
        }

        // Process items
        const processedItems = [];
        for (let item of (order.items || [])) {
          try {
            let productDetails = null;
            if (item.product && Product && typeof Product.findById === 'function') {
              productDetails = await Product.findById(item.product)
                .select('name images slug')
                .lean()
                .exec();
            }
            
            processedItems.push({
              ...item,
              product: productDetails
            });
          } catch (itemError) {
            processedItems.push({
              ...item,
              product: null
            });
          }
        }

        processedOrders.push({
          ...order,
          user: userDetails,
          items: processedItems
        });
        
      } catch (orderError) {
        console.warn('Error processing admin order:', orderError.message);
        processedOrders.push({
          ...order,
          user: null,
          items: order.items || []
        });
      }
    }

    const totalOrders = await Order.countDocuments(query);

    console.log(`👨‍💼 Admin retrieved ${processedOrders.length} orders`);

    res.json({ 
      success: true, 
      count: processedOrders.length, 
      total: totalOrders, 
      page: Number(page), 
      pages: Math.ceil(totalOrders / Number(limit)), 
      orders: processedOrders || [] 
    });

  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders: ' + error.message, 
      orders: [] 
    });
  }
});

// GET single order by ID
router.get('/:orderId', auth(), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid order ID format' 
      });
    }

    if (!Order || typeof Order.findById !== 'function') {
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not available' 
      });
    }

    const order = await Order.findById(orderId).lean().exec();
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if user owns this order or is admin
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin || req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Process order items
    const processedItems = [];
    for (let item of (order.items || [])) {
      try {
        let productDetails = null;
        if (item.product && Product && typeof Product.findById === 'function') {
          productDetails = await Product.findById(item.product)
            .select('name images slug price description')
            .lean()
            .exec();
        }
        
        processedItems.push({
          ...item,
          product: productDetails
        });
      } catch (itemError) {
        processedItems.push({
          ...item,
          product: null
        });
      }
    }

    const processedOrder = {
      ...order,
      items: processedItems
    };

    res.json({ 
      success: true, 
      order: processedOrder 
    });

  } catch (error) {
    console.error('❌ Error fetching single order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order: ' + error.message 
    });
  }
});

// POST - Create new order
router.post('/simple', auth(), async (req, res) => {
  try {
    console.log('🛒 Creating new order for user:', req.user._id);
    
    if (!Order || typeof Order !== 'function') {
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not available for creating orders' 
      });
    }
    
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    // Basic validation
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order items are required' 
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shipping address is required' 
      });
    }

    // Create order data
    const orderData = {
      user: req.user._id,
      items: orderItems.map(item => ({
        product: item.product || new mongoose.Types.ObjectId(),
        name: item.name || 'Unknown Product',
        price: Number(item.price) || 0,
        quantity: Number(item.qty || item.quantity) || 1,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        image: item.image || '',
        subtotal: (Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1)
      })),
      billing: {
        firstName: shippingAddress.firstName || 'Customer',
        lastName: shippingAddress.lastName || 'Name',
        email: req.user.email,
        phone: shippingAddress.phone || '0000000000',
        address: {
          street: shippingAddress.address || 'Address not provided',
          city: shippingAddress.city || 'City',
          state: shippingAddress.state || 'State',
          zipCode: shippingAddress.postalCode || '000000',
          country: shippingAddress.country || 'India'
        }
      },
      shipping: {
        firstName: shippingAddress.firstName || 'Customer',
        lastName: shippingAddress.lastName || 'Name',
        address: {
          street: shippingAddress.address || 'Address not provided',
          city: shippingAddress.city || 'City',
          state: shippingAddress.state || 'State',
          zipCode: shippingAddress.postalCode || '000000',
          country: shippingAddress.country || 'India'
        },
        method: 'standard',
        cost: 0
      },
      payment: {
        method: paymentMethod || 'cod',
        status: 'pending'
      },
      pricing: {
        subtotal: Number(totalPrice) || 0,
        tax: 0,
        shippingCost: 0,
        total: Number(totalPrice) || 0
      },
      status: 'pending'
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    console.log('✅ Order created successfully:', savedOrder._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        status: savedOrder.status,
        total: savedOrder.pricing.total
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order: ' + error.message 
    });
  }
});

// PUT - Update order status (admin only)
router.put('/:orderId/status', auth(), adminOnly, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid order ID' 
      });
    }

    if (!Order || typeof Order.findByIdAndUpdate !== 'function') {
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not available for updates' 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      order 
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order status: ' + error.message 
    });
  }
});

module.exports = router;