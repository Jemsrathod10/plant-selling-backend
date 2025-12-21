const express = require('express');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// 👉 Get all categories (for dropdown)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories,
      message: categories.length === 0 ? 'No categories found' : 'Categories fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      categories: [],
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// 👉 Add new category (Admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { name, description, image, icon, parentCategory } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Validate parentCategory if provided
    let parentId = null;
    if (parentCategory && mongoose.Types.ObjectId.isValid(parentCategory)) {
      parentId = parentCategory;
    }

    const category = new Category({
      name,
      description,
      image,
      icon,
      parentCategory: parentId
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: savedCategory
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

module.exports = router;
