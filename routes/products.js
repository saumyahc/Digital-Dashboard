const express = require('express');
const multer = require('multer');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Special routes
router.get('/low-stock', protect, getLowStockProducts);
router.get('/inventory-value', protect, getInventoryValue);

// Photo upload route
router.route('/:id/photo').put(protect, productPhotoUpload);

// Standard CRUD routes
router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('image'), createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, upload.single('image'), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;