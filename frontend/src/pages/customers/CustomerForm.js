import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerAPI.getCustomerById(id);
      const customer = response.data.data;
      
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        notes: customer.notes || ''
      });
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Failed to load customer details. Please try again.');
      toast.error('Error loading customer details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await customerAPI.updateCustomer(id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerAPI.createCustomer(formData);
        toast.success('Customer created successfully');
      }
      
      navigate('/customers');
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer. Please try again.');
      toast.error('Error saving customer');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </h1>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/customers')}
        >
          Cancel
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <FormInput
              label="Customer Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            
            {/* Email */}
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            
            {/* Phone */}
            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />
            
            {/* Address */}
            <FormInput
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
            />
            
            {/* City */}
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
            />
            
            {/* State */}
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              error={errors.state}
            />
            
            {/* Pincode */}
            <FormInput
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              error={errors.pincode}
            />
          </div>
          
          {/* Notes */}
          <div>
            <FormInput
              label="Notes"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleChange}
              error={errors.notes}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customers')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CustomerForm;