const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
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
    let query = Sale.find(JSON.parse(queryStr))
      .populate({
        path: 'customer',
        select: 'name phone'
      })
      .populate({
        path: 'items.product',
        select: 'name modelNumber'
      })
      .populate({
        path: 'createdBy',
        select: 'name'
      });

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
    const total = await Sale.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const sales = await query;

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
      count: sales.length,
      pagination,
      data: sales
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting sales', error: error.message });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate({
        path: 'customer',
        select: 'name phone email address'
      })
      .populate({
        path: 'items.product',
        select: 'name modelNumber'
      })
      .populate({
        path: 'createdBy',
        select: 'name'
      });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ message: 'Error getting sale', error: error.message });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res) => {
  try {
    console.log('Sale creation request body:', req.body);
    
    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Handle walk-in customer (no customer ID provided)
    if (!req.body.customer || req.body.customer === '') {
      // Create a walk-in customer record
      const walkInCustomer = await Customer.create({
        name: 'Walk-in Customer',
        age: 0,
        gender: 'Other',
        phone: '000-000-0000'
      });
      req.body.customer = walkInCustomer._id;
    } else {
      // Validate customer exists
      const customer = await Customer.findById(req.body.customer);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
    }

    // Validate and process items
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ message: 'Please add at least one item' });
    }

    let subtotal = 0;

    // Process each item
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      
      // Validate product exists
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found for item ${i + 1}` });
      }
      
      // Validate quantity
      if (item.quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for item ${i + 1}` });
      }
      
      // Validate stock availability
      if (item.quantity > product.stockQuantity) {
        return res.status(400).json({ 
          message: `Not enough stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}` 
        });
      }
      
      // Set price from product
      item.price = product.sellingPrice;
      
      // Calculate total for this item
      item.total = item.price * item.quantity;
      
      // Add to subtotal
      subtotal += item.total;
      
      // Update product stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Calculate tax, discount and total
    const taxRate = req.body.taxRate || 0.18; // Default 18%
    const taxAmount = subtotal * taxRate;
    
    const discountRate = req.body.discountRate || 0;
    const discountAmount = subtotal * discountRate;
    
    const total = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Find the latest invoice with the same date prefix
    const latestSale = await Sale.findOne(
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
    const invoiceNumber = `${dateStr}${String(nextNumber).padStart(4, '0')}`;

    // Create sale object
    const saleData = {
      invoiceNumber,
      customer: req.body.customer,
      items: req.body.items,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      total,
      paymentMethod: req.body.paymentMethod || 'Cash',
      paymentStatus: req.body.paymentStatus || 'Paid',
      notes: req.body.notes,
      createdBy: req.user.id
    };

    console.log('Creating sale with data:', saleData);
    const sale = await Sale.create(saleData);
    console.log('Sale created successfully:', sale);

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    console.error('Sale creation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/sales/:id/invoice
// @access  Private
exports.generateInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate({
        path: 'customer',
        select: 'name phone email address'
      })
      .populate({
        path: 'items.product',
        select: 'name modelNumber'
      })
      .populate({
        path: 'createdBy',
        select: 'name'
      });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoiceNumber}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company logo
    // doc.image('path/to/logo.png', 50, 45, { width: 50 });

    // Add company info
    doc.fontSize(20).text('Surgical Prosthetics', 50, 50);
    doc.fontSize(10).text('123 Medical Plaza, Healthcare City', 50, 75);
    doc.text('Phone: +1 234 567 8901', 50, 90);
    doc.text('Email: info@surgicalprosthetics.com', 50, 105);
    doc.moveDown();

    // Add invoice details
    doc.fontSize(16).text('INVOICE', 50, 140);
    doc.fontSize(10).text(`Invoice Number: ${sale.invoiceNumber}`, 50, 160);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 50, 175);
    doc.text(`Payment Status: ${sale.paymentStatus}`, 50, 190);
    doc.text(`Payment Method: ${sale.paymentMethod}`, 50, 205);

    // Add customer details
    doc.fontSize(16).text('Customer Details', 300, 140);
    doc.fontSize(10).text(`Name: ${sale.customer.name}`, 300, 160);
    doc.text(`Phone: ${sale.customer.phone}`, 300, 175);
    if (sale.customer.email) doc.text(`Email: ${sale.customer.email}`, 300, 190);
    
    // Add address if available
    if (sale.customer.address) {
      let addressText = '';
      if (sale.customer.address.street) addressText += sale.customer.address.street;
      if (sale.customer.address.city) {
        if (addressText) addressText += ', ';
        addressText += sale.customer.address.city;
      }
      if (sale.customer.address.state) {
        if (addressText) addressText += ', ';
        addressText += sale.customer.address.state;
      }
      if (sale.customer.address.zipCode) {
        if (addressText) addressText += ' - ';
        addressText += sale.customer.address.zipCode;
      }
      if (addressText) doc.text(`Address: ${addressText}`, 300, 205);
    }

    // Add table headers
    doc.moveDown(3);
    const tableTop = 250;
    doc.fontSize(10).text('Item', 50, tableTop);
    doc.text('Model', 180, tableTop);
    doc.text('Qty', 280, tableTop);
    doc.text('Price', 320, tableTop);
    doc.text('Total', 400, tableTop);

    // Add line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Add items
    let tablePosition = tableTop + 30;
    sale.items.forEach(item => {
      doc.text(item.product.name, 50, tablePosition);
      doc.text(item.product.modelNumber, 180, tablePosition);
      doc.text(item.quantity.toString(), 280, tablePosition);
      doc.text(`$${item.price.toFixed(2)}`, 320, tablePosition);
      doc.text(`$${item.total.toFixed(2)}`, 400, tablePosition);
      tablePosition += 20;
    });

    // Add line
    doc.moveTo(50, tablePosition).lineTo(550, tablePosition).stroke();
    tablePosition += 20;

    // Add totals
    doc.text('Subtotal:', 300, tablePosition);
    doc.text(`$${sale.subtotal.toFixed(2)}`, 400, tablePosition);
    tablePosition += 20;

    doc.text(`Tax (${(sale.taxRate * 100).toFixed(0)}%):`, 300, tablePosition);
    doc.text(`$${sale.taxAmount.toFixed(2)}`, 400, tablePosition);
    tablePosition += 20;

    if (sale.discountAmount > 0) {
      doc.text(`Discount (${(sale.discountRate * 100).toFixed(0)}%):`, 300, tablePosition);
      doc.text(`-$${sale.discountAmount.toFixed(2)}`, 400, tablePosition);
      tablePosition += 20;
    }

    doc.fontSize(12).text('Total:', 300, tablePosition);
    doc.fontSize(12).text(`$${sale.total.toFixed(2)}`, 400, tablePosition);

    // Add notes if any
    if (sale.notes) {
      tablePosition += 40;
      doc.fontSize(10).text('Notes:', 50, tablePosition);
      doc.text(sale.notes, 50, tablePosition + 15);
    }

    // Add footer
    doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
};

// @desc    Get sales report
// @route   GET /api/sales/report
// @access  Private
exports.getSalesReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (period) {
      const now = new Date();
      let start = new Date();
      
      switch (period) {
        case 'daily':
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start.setDate(now.getDate() - 30);
      }
      
      matchStage = {
        createdAt: {
          $gte: start,
          $lte: now
        }
      };
    }
    
    // Aggregate sales data
    const salesData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          averageSaleValue: { $avg: '$total' }
        }
      }
    ]);
    
    // Get top selling products
    const topProducts = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 1,
          name: '$productDetails.name',
          modelNumber: '$productDetails.modelNumber',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);
    
    // Get sales by payment method
    const salesByPaymentMethod = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Get sales by day (for charts)
    const salesByDay = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: salesData.length > 0 ? salesData[0] : {
          totalSales: 0,
          totalRevenue: 0,
          totalTax: 0,
          totalDiscount: 0,
          averageSaleValue: 0
        },
        topProducts,
        salesByPaymentMethod,
        salesByDay
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating sales report', error: error.message });
  }
};