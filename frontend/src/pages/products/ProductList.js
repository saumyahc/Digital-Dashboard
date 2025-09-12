import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { productAPI } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const limit = 10;

  const fetchProducts = async (page = 1, search = '', sort = `${sortDirection === 'asc' ? '' : '-'}${sortField}`) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = `?page=${page}&limit=${limit}&sort=${sort}${search ? `&search=${search}` : ''}`;
      const response = await productAPI.getAllProducts(queryParams);
      
      setProducts(response.data.data);
      setTotalPages(Math.ceil(response.data.count / limit));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, `${sortDirection === 'asc' ? '' : '-'}${sortField}`);
  }, [currentPage, sortDirection, sortField]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchProducts(1, searchTerm);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleteLoading(true);
      await productAPI.deleteProduct(productToDelete._id);
      toast.success('Product deleted successfully');
      fetchProducts(currentPage, searchTerm); // Refresh the list
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center">
          {row.imageUrl && (
            <img 
              src={row.imageUrl} 
              alt={row.name} 
              className="h-10 w-10 rounded-full mr-3 object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-gray-500 text-sm">{row.sku}</div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => formatCurrency(row.price),
      sortable: true
    },
    {
      header: 'Stock',
      accessor: 'stockQuantity',
      cell: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.stockQuantity <= row.reorderLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {row.stockQuantity}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Reorder Level',
      accessor: 'reorderLevel',
      sortable: true
    },
    {
      header: 'Last Updated',
      accessor: 'updatedAt',
      cell: (row) => formatDate(row.updatedAt),
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Link to={`/products/edit/${row._id}`}>
            <button className="text-indigo-600 hover:text-indigo-900">
              <PencilIcon className="h-5 w-5" />
            </button>
          </Link>
          <button 
            onClick={() => openDeleteModal(row)} 
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && products.length === 0) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <Link to="/products/add">
          <Button type="button" variant="primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex w-full md:w-1/2">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              showButton
            />
          </form>
        </div>

        <Table
          columns={columns}
          data={products}
          loading={loading}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          emptyMessage="No products found"
        />

        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Product"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{productToDelete?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeDeleteModal}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="danger" 
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;