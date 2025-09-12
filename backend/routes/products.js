const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  productPhotoUpload,
  getLowStockProducts,
  getInventoryValue
} = require('../controllers/products');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Special routes
router.get('/low-stock', protect, getLowStockProducts);
router.get('/inventory-value', protect, getInventoryValue);

// Photo upload route
router.route('/:id/photo').put(protect, productPhotoUpload);

// Standard CRUD routes
router.route('/')
  .get(protect, getProducts)
  .post(protect, createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;