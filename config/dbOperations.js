const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Category = require('../models/Category');

class DatabaseOperations {
  // User Operations
  static async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      return await User.findById(userId).populate('orderHistory').populate('wishlist');
    } catch (error) {
      throw new Error(`User fetch failed: ${error.message}`);
    }
  }

  static async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(userId, updateData, { 
        new: true, 
        runValidators: true 
      });
    } catch (error) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      return await User.findByIdAndDelete(userId);
    } catch (error) {
      throw new Error(`User deletion failed: ${error.message}`);
    }
  }

  // Product Operations
  static async createProduct(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Product creation failed: ${error.message}`);
    }
  }

  static async getProducts(filters = {}, sort = { createdAt: -1 }, limit = 0) {
    try {
      let query = Product.find(filters);
      
      if (sort) query = query.sort(sort);
      if (limit) query = query.limit(limit);
      
      return await query.populate('reviews').exec();
    } catch (error) {
      throw new Error(`Product fetch failed: ${error.message}`);
    }
  }

  static async updateProduct(productId, updateData) {
    try {
      return await Product.findByIdAndUpdate(productId, updateData, { 
        new: true, 
        runValidators: true 
      });
    } catch (error) {
      throw new Error(`Product update failed: ${error.message}`);
    }
  }

  static async deleteProduct(productId) {
    try {
      // Also delete related reviews
      await Review.deleteMany({ product: productId });
      return await Product.findByIdAndDelete(productId);
    } catch (error) {
      throw new Error(`Product deletion failed: ${error.message}`);
    }
  }

  // Order Operations
  static async createOrder(orderData) {
    try {
      const order = new Order(orderData);
      const savedOrder = await order.save();
      
      // Update user's order history
      await User.findByIdAndUpdate(
        orderData.user, 
        { $push: { orderHistory: savedOrder._id } }
      );
      
      return savedOrder;
    } catch (error) {
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  static async getOrdersByUser(userId) {
    try {
      return await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('orderItems.product');
    } catch (error) {
      throw new Error(`Orders fetch failed: ${error.message}`);
    }
  }

  static async updateOrderStatus(orderId, status, updatedBy = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');
      
      return await order.updateStatus(status, `Status updated to ${status}`, updatedBy);
    } catch (error) {
      throw new Error(`Order status update failed: ${error.message}`);
    }
  }

  // Review Operations
  static async createReview(reviewData) {
    try {
      const review = new Review(reviewData);
      return await review.save();
    } catch (error) {
      throw new Error(`Review creation failed: ${error.message}`);
    }
  }

  static async getProductReviews(productId) {
    try {
      return await Review.find({ product: productId, approved: true })
        .populate('user', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Reviews fetch failed: ${error.message}`);
    }
  }

  // Category Operations
  static async createCategory(categoryData) {
    try {
      const category = new Category(categoryData);
      return await category.save();
    } catch (error) {
      throw new Error(`Category creation failed: ${error.message}`);
    }
  }

  static async getCategories() {
    try {
      return await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    } catch (error) {
      throw new Error(`Categories fetch failed: ${error.message}`);
    }
  }

  // Search Operations
  static async searchProducts(searchTerm, filters = {}) {
    try {
      const searchQuery = {
        ...filters,
        $text: { $search: searchTerm }
      };
      
      return await Product.find(searchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } catch (error) {
      throw new Error(`Product search failed: ${error.message}`);
    }
  }

  // Analytics Operations
  static async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        lowStockProducts
      ] = await Promise.all([
        User.countDocuments({ isAdmin: false }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.aggregate([
          { $group: { _id: null, total: { $sum: '$pricing.totalPrice' } } }
        ]),
        Product.countDocuments({ stock: { $lte: 5, $gt: 0 } })
      ]);

      return {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        lowStockProducts
      };
    } catch (error) {
      throw new Error(`Dashboard stats failed: ${error.message}`);
    }
  }
}

module.exports = DatabaseOperations;
