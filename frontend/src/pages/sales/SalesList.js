import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusIcon, EyeIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { saleAPI } from '../../utils/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import FormSelect from '../../components/ui/FormSelect';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const limit = 10;

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' }
  ];

  const fetchSales = async (page = 1, search = '', sort = `${sortDirection === 'asc' ? '' : '-'}${sortField}`, status = '', paymentMethod = '') => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `?page=${page}&limit=${limit}&sort=${sort}`;
      if (search) queryParams += `&search=${search}`;
      if (status) queryParams += `&paymentStatus=${status}`;
      if (paymentMethod) queryParams += `&paymentMethod=${paymentMethod}`;
      
      const response = await saleAPI.getAllSales(queryParams);
      
      setSales(response.data.data);
      setTotalPages(Math.ceil(response.data.count / limit));
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales. Please try again.');
      toast.error('Error loading sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(currentPage, searchTerm, `${sortDirection === 'asc' ? '' : '-'}${sortField}`, filterStatus, filterPaymentMethod);
  }, [currentPage, sortDirection, sortField, filterStatus, filterPaymentMethod]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchSales(1, searchTerm, `${sortDirection === 'asc' ? '' : '-'}${sortField}`, filterStatus, filterPaymentMethod);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for new sort field
    }
  };

  const handleFilterChange = (name, value) => {
    if (name === 'status') {
      setFilterStatus(value);
    } else if (name === 'paymentMethod') {
      setFilterPaymentMethod(value);
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  const openDeleteModal = (sale) => {
    setSaleToDelete(sale);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSaleToDelete(null);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    
    try {
      setDeleteLoading(true);
      await saleAPI.deleteSale(saleToDelete._id);
      toast.success('Sale deleted successfully');
      fetchSales(currentPage, searchTerm, `${sortDirection === 'asc' ? '' : '-'}${sortField}`, filterStatus, filterPaymentMethod); // Refresh the list
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting sale:', err);
      toast.error('Failed to delete sale');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadInvoice = async (saleId) => {
    try {
      toast.info('Generating invoice...');
      const response = await saleAPI.generateInvoice(saleId);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element to download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (row) => (
        <Link to={`/sales/${row._id}`} className="text-blue-600 hover:text-blue-900 font-medium">
          {row.invoiceNumber}
        </Link>
      ),
      sortable: true
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <div>
          {row.customer ? (
            <Link to={`/customers/${row.customer._id}`} className="text-gray-900 hover:text-gray-700">
              {row.customer.name}
            </Link>
          ) : (
            <span className="text-gray-500">Walk-in Customer</span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      cell: (row) => formatDateTime(row.createdAt),
      sortable: true
    },
    {
      header: 'Amount',
      accessor: 'totalAmount',
      cell: (row) => formatCurrency(row.totalAmount),
      sortable: true
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      cell: (row) => row.paymentMethod,
      sortable: true
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      cell: (row) => {
        let statusClass = '';
        switch (row.paymentStatus) {
          case 'Paid':
            statusClass = 'bg-green-100 text-green-800';
            break;
          case 'Pending':
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'Cancelled':
            statusClass = 'bg-red-100 text-red-800';
            break;
          default:
            statusClass = 'bg-gray-100 text-gray-800';
        }
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {row.paymentStatus}
          </span>
        );
      },
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Link to={`/sales/${row._id}`}>
            <button className="text-indigo-600 hover:text-indigo-900" title="View Details">
              <EyeIcon className="h-5 w-5" />
            </button>
          </Link>
          <button 
            onClick={() => handleDownloadInvoice(row._id)} 
            className="text-green-600 hover:text-green-900"
            title="Download Invoice"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => openDeleteModal(row)} 
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  if (loading && sales.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && sales.length === 0) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <Link to="/sales/new">
          <Button type="button" variant="primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Sale
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <form onSubmit={handleSearch} className="flex w-full md:w-1/3">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice or customer..."
                showButton
              />
            </form>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-48">
                <FormSelect
                  name="status"
                  value={filterStatus}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={statusOptions}
                  placeholder="Filter by status"
                />
              </div>
              <div className="w-full md:w-48">
                <FormSelect
                  name="paymentMethod"
                  value={filterPaymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  options={paymentMethodOptions}
                  placeholder="Filter by payment"
                />
              </div>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={sales}
          loading={loading}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          emptyMessage="No sales found"
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
        title="Delete Sale"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete invoice <span className="font-semibold">{saleToDelete?.invoiceNumber}</span>? This action cannot be undone.
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

export default SalesList;