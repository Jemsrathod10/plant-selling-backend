const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Plant Selling API is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    status: 'OK',
    database: states[mongoose.connection.readyState],
    timestamp: new Date().toISOString()
  });
});

// ✅ ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orders'));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌱 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🏷️ Categories API: http://localhost:${PORT}/api/categories`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
});
