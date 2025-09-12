import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { customerAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const limit = 10;

  const fetchCustomers = async (page = 1, search = '', sort = `${sortDirection === 'asc' ? '' : '-'}${sortField}`) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = `?page=${page}&limit=${limit}&sort=${sort}${search ? `&search=${search}` : ''}`;
      const response = await customerAPI.getAllCustomers(queryParams);
      
      setCustomers(response.data.data);
      setTotalPages(Math.ceil(response.data.count / limit));
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      toast.error('Error loading customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm, `${sortDirection === 'asc' ? '' : '-'}${sortField}`);
  }, [currentPage, sortDirection, sortField]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchCustomers(1, searchTerm);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      setDeleteLoading(true);
      await customerAPI.deleteCustomer(customerToDelete._id);
      toast.success('Customer deleted successfully');
      fetchCustomers(currentPage, searchTerm); // Refresh the list
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'name',
      cell: (row) => (
        <div className="font-medium text-gray-900">{row.name}</div>
      ),
      sortable: true
    },
    {
      header: 'Contact',
      accessor: 'contact',
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <PhoneIcon className="h-4 w-4 mr-1" />
            {row.phone}
          </div>
          {row.email && (
            <div className="flex items-center text-sm text-gray-500">
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              {row.email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Address',
      accessor: 'address',
      cell: (row) => (
        <div className="text-sm text-gray-500">
          {row.address && (
            <div className="truncate max-w-xs">
              {row.address}
              {row.city && `, ${row.city}`}
              {row.state && `, ${row.state}`}
              {row.pincode && ` - ${row.pincode}`}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Total Purchases',
      accessor: 'totalPurchases',
      cell: (row) => (
        <div className="text-sm font-medium text-gray-900">
          {row.totalPurchases || 0}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Last Purchase',
      accessor: 'lastPurchaseDate',
      cell: (row) => (
        <div className="text-sm text-gray-500">
          {row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : 'Never'}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Added On',
      accessor: 'createdAt',
      cell: (row) => formatDate(row.createdAt),
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Link to={`/customers/edit/${row._id}`}>
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

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && customers.length === 0) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <Link to="/customers/add">
          <Button type="button" variant="primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Customer
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex w-full md:w-1/2">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              showButton
            />
          </form>
        </div>

        <Table
          columns={columns}
          data={customers}
          loading={loading}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          emptyMessage="No customers found"
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
        title="Delete Customer"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{customerToDelete?.name}</span>? This action cannot be undone.
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

export default CustomerList;