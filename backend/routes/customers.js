const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerWithHistory,
  searchCustomers
} = require('../controllers/customers');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Special routes
router.get('/search', protect, searchCustomers);
router.get('/:id/history', protect, getCustomerWithHistory);

// Standard CRUD routes
router.route('/')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router;