const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const SaleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 0.18 // 18% tax rate
  },
  taxAmount: {
    type: Number,
    required: true
  },
  discountRate: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Paid'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate invoice number before saving
SaleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    // Get current date in YYYYMMDD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Find the latest invoice with the same date prefix
    const latestSale = await this.constructor.findOne(
      { invoiceNumber: new RegExp(`^${dateStr}`) },
      {},
      { sort: { invoiceNumber: -1 } }
    );
    
    let nextNumber = 1;
    if (latestSale && latestSale.invoiceNumber) {
      // Extract the number part and increment
      const lastNumber = parseInt(latestSale.invoiceNumber.slice(8), 10);
      nextNumber = lastNumber + 1;
    }
    
    // Create new invoice number (YYYYMMDD + 4-digit sequential number)
    this.invoiceNumber = `${dateStr}${String(nextNumber).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);