const express = require('express');
const {
  getSales,
  getSale,
  createSale,
  generateInvoice,
  getSalesReport
} = require('../controllers/sales');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Special routes
router.get('/report', protect, getSalesReport);
router.get('/:id/invoice', protect, generateInvoice);

// Standard CRUD routes
router.route('/')
  .get(protect, getSales)
  .post(protect, createSale);

router.route('/:id')
  .get(protect, getSale);

module.exports = router;