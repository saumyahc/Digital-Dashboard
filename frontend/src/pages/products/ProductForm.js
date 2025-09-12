import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    sku: '',
    barcode: '',
    stockQuantity: '',
    reorderLevel: '',
    image: null
  });

  const [errors, setErrors] = useState({});

  const categoryOptions = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Clothing', label: 'Clothing' },
    { value: 'Food & Beverages', label: 'Food & Beverages' },
    { value: 'Home & Kitchen', label: 'Home & Kitchen' },
    { value: 'Beauty & Personal Care', label: 'Beauty & Personal Care' },
    { value: 'Sports & Outdoors', label: 'Sports & Outdoors' },
    { value: 'Books & Stationery', label: 'Books & Stationery' },
    { value: 'Toys & Games', label: 'Toys & Games' },
    { value: 'Health & Wellness', label: 'Health & Wellness' },
    { value: 'Automotive', label: 'Automotive' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getProductById(id);
      const product = response.data.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        costPrice: product.costPrice || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        stockQuantity: product.stockQuantity || '',
        reorderLevel: product.reorderLevel || '',
        image: null // We don't set the image file here
      });
      
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details. Please try again.');
      toast.error('Error loading product details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (formData.costPrice && (isNaN(formData.costPrice) || Number(formData.costPrice) < 0)) {
      newErrors.costPrice = 'Cost price must be a non-negative number';
    }
    
    if (!formData.stockQuantity) {
      newErrors.stockQuantity = 'Stock quantity is required';
    } else if (isNaN(formData.stockQuantity) || Number(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Stock quantity must be a non-negative number';
    }
    
    if (!formData.reorderLevel) {
      newErrors.reorderLevel = 'Reorder level is required';
    } else if (isNaN(formData.reorderLevel) || Number(formData.reorderLevel) < 0) {
      newErrors.reorderLevel = 'Reorder level must be a non-negative number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      // Create preview for the image
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Create FormData object for file upload
      const productFormData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          productFormData.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== undefined) {
          productFormData.append(key, formData[key]);
        }
      });
      
      if (isEditMode) {
        await productAPI.updateProduct(id, productFormData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(productFormData);
        toast.success('Product created successfully');
      }
      
      navigate('/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
      toast.error('Error saving product');
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
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/products')}
        >
          Cancel
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <FormInput
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            
            {/* Category */}
            <FormSelect
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              error={errors.category}
              required
            />
            
            {/* Price */}
            <FormInput
              label="Selling Price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              required
            />
            
            {/* Cost Price */}
            <FormInput
              label="Cost Price"
              name="costPrice"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={handleChange}
              error={errors.costPrice}
            />
            
            {/* SKU */}
            <FormInput
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
            />
            
            {/* Barcode */}
            <FormInput
              label="Barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              error={errors.barcode}
            />
            
            {/* Stock Quantity */}
            <FormInput
              label="Stock Quantity"
              name="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={handleChange}
              error={errors.stockQuantity}
              required
            />
            
            {/* Reorder Level */}
            <FormInput
              label="Reorder Level"
              name="reorderLevel"
              type="number"
              value={formData.reorderLevel}
              onChange={handleChange}
              error={errors.reorderLevel}
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <FormInput
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              rows={4}
            />
          </div>
          
          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-md bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  JPG, PNG or GIF up to 5MB
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" /> : isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductForm;