const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      // ✅ Get token from header (case-insensitive)
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token, authorization denied' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing' });
      }

      // ✅ Verify token safely
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-plant-shop-2024');
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
      }

      // ✅ Ensure decoded contains userId
      const userId = decoded.userId || decoded.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Invalid token payload' });

      // ✅ Fetch user from DB (exclude password)
      const user = await User.findById(userId).select('-password');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });

      req.user = user; // attach user to request

      // ✅ Check role if required
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ success: false, message: `Access denied. You need ${requiredRole} privileges.` });
      }

      next(); // all good, continue to route
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ success: false, message: 'Server error in auth middleware' });
    }
  };
};
