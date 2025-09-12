import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { productAPI, customerAPI, saleAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

const NewSale = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  
  const [saleData, setSaleData] = useState({
    customer: '',
    items: [],
    subTotal: 0,
    discount: 0,
    tax: 0,
    totalAmount: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: ''
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [customerErrors, setCustomerErrors] = useState({});

  const paymentMethodOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' }
  ];

  const paymentStatusOptions = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Pending', label: 'Pending' }
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customers
        const customersRes = await customerAPI.getAllCustomers('?limit=100');
        setCustomers(customersRes.data.data);

        // Fetch products
        const productsRes = await productAPI.getAllProducts('?limit=100');
        setProducts(productsRes.data.data);

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load required data. Please try again.');
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Calculate totals whenever items, discount or tax changes
  useEffect(() => {
    const subTotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAfterDiscount = subTotal - saleData.discount;
    const totalWithTax = totalAfterDiscount + saleData.tax;
    
    setSaleData(prev => ({
      ...prev,
      subTotal,
      totalAmount: totalWithTax
    }));
  }, [saleData.items, saleData.discount, saleData.tax]);

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    if (!productId) return;
    
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Check if product is already in the list
    const existingIndex = saleData.items.findIndex(item => item.product === productId);
    
    if (existingIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...saleData.items];
      updatedItems[existingIndex].quantity += 1;
      setSaleData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new product to the list
      const newItem = {
        product: productId,
        name: product.name,
        price: product.price,
        quantity: 1
      };
      setSaleData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
    
    // Reset the select input
    setSelectedProducts([...selectedProducts, productId]);
    e.target.value = '';
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...saleData.items];
    const removedItem = updatedItems[index];
    updatedItems.splice(index, 1);
    setSaleData(prev => ({ ...prev, items: updatedItems }));
    
    // Remove from selected products
    setSelectedProducts(selectedProducts.filter(id => id !== removedItem.product));
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...saleData.items];
    updatedItems[index].quantity = newQuantity;
    setSaleData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSaleData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setSaleData(prev => ({ ...prev, [name]: numericValue }));
    }
  };

  const validateCustomerForm = () => {
    const errors = {};
    
    if (!newCustomer.name.trim()) errors.name = 'Name is required';
    if (!newCustomer.phone.trim()) errors.phone = 'Phone is required';
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = 'Invalid email format';
    }
    
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async () => {
    if (!validateCustomerForm()) return;
    
    try {
      const response = await customerAPI.createCustomer(newCustomer);
      const createdCustomer = response.data.data;
      
      // Add to customers list and select it
      setCustomers(prev => [...prev, createdCustomer]);
      setSaleData(prev => ({ ...prev, customer: createdCustomer._id }));
      
      // Close modal and reset form
      setCustomerModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      toast.success('Customer added successfully');
    } catch (err) {
      console.error('Error creating customer:', err);
      toast.error('Failed to create customer');
    }
  };

  const validateSaleForm = () => {
    if (saleData.items.length === 0) {
      toast.error('Please add at least one product');
      return false;
    }
    
    if (saleData.totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSaleForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Format the sale data for API
      const formattedSaleData = {
        customer: saleData.customer || null, // null for walk-in customer
        items: saleData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        })),
        subTotal: saleData.subTotal,
        discount: saleData.discount,
        tax: saleData.tax,
        totalAmount: saleData.totalAmount,
        paymentMethod: saleData.paymentMethod,
        paymentStatus: saleData.paymentStatus,
        notes: saleData.notes
      };
      
      const response = await saleAPI.createSale(formattedSaleData);
      toast.success('Sale created successfully');
      
      // Navigate to the sale details page
      navigate(`/sales/${response.data.data._id}`);
    } catch (err) {
      console.error('Error creating sale:', err);
      setError('Failed to create sale. Please try again.');
      toast.error('Error creating sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const availableProducts = products.filter(product => 
    !selectedProducts.includes(product._id) && product.stockQuantity > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">New Sale</h1>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/sales')}
        >
          Cancel
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card title="Customer Information">
              <div className="p-6 space-y-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <FormSelect
                      label="Select Customer"
                      name="customer"
                      value={saleData.customer}
                      onChange={handleInputChange}
                      options={[
                        { value: '', label: 'Walk-in Customer' },
                        ...customers.map(c => ({ value: c._id, label: `${c.name} (${c.phone})` }))
                      ]}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCustomerModalOpen(true)}
                  >
                    <PlusIcon className="-ml-1 mr-1 h-5 w-5" />
                    New Customer
                  </Button>
                </div>
              </div>
            </Card>

            {/* Product Selection */}
            <Card title="Products">
              <div className="p-6 space-y-6">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <FormSelect
                      label="Add Product"
                      onChange={handleProductSelect}
                      options={[
                        { value: '', label: 'Select a product' },
                        ...availableProducts.map(p => ({ 
                          value: p._id, 
                          label: `${p.name} (${formatCurrency(p.price)}) - ${p.stockQuantity} in stock` 
                        }))
                      ]}
                      disabled={availableProducts.length === 0}
                    />
                  </div>
                </div>

                {/* Product List */}
                {saleData.items.length > 0 ? (
                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {saleData.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    className="p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                    className="w-16 text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                                  <button
                                    type="button"
                                    className="p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No products added yet. Select products from the dropdown above.
                  </div>
                )}
              </div>
            </Card>

            {/* Notes */}
            <Card title="Additional Information">
              <div className="p-6">
                <FormInput
                  label="Notes"
                  name="notes"
                  type="textarea"
                  value={saleData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes or information about this sale"
                  rows={3}
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-6">
            <Card title="Payment Information">
              <div className="p-6 space-y-4">
                <FormSelect
                  label="Payment Method"
                  name="paymentMethod"
                  value={saleData.paymentMethod}
                  onChange={handleInputChange}
                  options={paymentMethodOptions}
                />

                <FormSelect
                  label="Payment Status"
                  name="paymentStatus"
                  value={saleData.paymentStatus}
                  onChange={handleInputChange}
                  options={paymentStatusOptions}
                />
              </div>
            </Card>

            <Card title="Order Summary">
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(saleData.subTotal)}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Discount:</span>
                  <div className="w-1/3">
                    <FormInput
                      type="number"
                      name="discount"
                      value={saleData.discount}
                      onChange={handleNumericInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Tax:</span>
                  <div className="w-1/3">
                    <FormInput
                      type="number"
                      name="tax"
                      value={saleData.tax}
                      onChange={handleNumericInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(saleData.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/sales')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || saleData.items.length === 0}
              >
                {submitting ? <Spinner size="sm" /> : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* New Customer Modal */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Add New Customer"
      >
        <div className="p-6 space-y-4">
          <FormInput
            label="Customer Name"
            name="name"
            value={newCustomer.name}
            onChange={handleNewCustomerChange}
            error={customerErrors.name}
            required
          />
          
          <FormInput
            label="Phone"
            name="phone"
            value={newCustomer.phone}
            onChange={handleNewCustomerChange}
            error={customerErrors.phone}
            required
          />
          
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={newCustomer.email}
            onChange={handleNewCustomerChange}
            error={customerErrors.email}
          />
          
          <FormInput
            label="Address"
            name="address"
            type="textarea"
            value={newCustomer.address}
            onChange={handleNewCustomerChange}
            rows={2}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddCustomer}
            >
              Add Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NewSale;