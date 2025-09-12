const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Product.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting products', error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Error getting product', error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete product image if it exists and is not the default
    if (product.image && product.image !== 'no-photo.jpg') {
      const imagePath = path.join(__dirname, '../uploads', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await product.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// @desc    Upload product image
// @route   PUT /api/products/:id/photo
// @access  Private
exports.productPhotoUpload = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.files) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD || file.size > 1000000) { // Default 1MB if env not set
      return res.status(400).json({ message: 'Please upload an image less than 1MB' });
    }

    // Create custom filename
    file.name = `photo_${product._id}${path.parse(file.name).ext}`;

    // Delete old image if it exists and is not the default
    if (product.image && product.image !== 'no-photo.jpg') {
      const imagePath = path.join(__dirname, '../uploads', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Move file to upload path
    file.mv(`${process.env.FILE_UPLOAD_PATH || './uploads'}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Problem with file upload' });
      }

      await Product.findByIdAndUpdate(req.params.id, { image: file.name });

      res.status(200).json({ success: true, data: file.name });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find().where('stockQuantity').lte('lowStockThreshold');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting low stock products', error: error.message });
  }
};

// @desc    Get inventory value
// @route   GET /api/products/inventory-value
// @access  Private
exports.getInventoryValue = async (req, res) => {
  try {
    const products = await Product.find();
    
    let totalCostValue = 0;
    let totalSellingValue = 0;
    
    products.forEach(product => {
      totalCostValue += product.costPrice * product.stockQuantity;
      totalSellingValue += product.sellingPrice * product.stockQuantity;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalCostValue,
        totalSellingValue,
        potentialProfit: totalSellingValue - totalCostValue,
        productCount: products.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating inventory value', error: error.message });
  }
};