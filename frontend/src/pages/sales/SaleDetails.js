import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { saleAPI } from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const SaleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await saleAPI.getSaleById(id);
        setSale(response.data.data);
      } catch (err) {
        console.error('Error fetching sale details:', err);
        setError('Failed to load sale details. Please try again.');
        toast.error('Error loading sale details');
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      toast.info('Generating invoice...');
      const response = await saleAPI.generateInvoice(id);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element to download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${sale.invoiceNumber}.pdf`);
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

  const handlePrintInvoice = async () => {
    try {
      toast.info('Preparing invoice for printing...');
      const response = await saleAPI.generateInvoice(id);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open the PDF in a new window and print it
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        toast.warning('Please allow pop-ups to print the invoice');
      }
    } catch (err) {
      console.error('Error printing invoice:', err);
      toast.error('Failed to print invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !sale) {
    return <Alert type="error" message={error || 'Sale not found'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/sales')} 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Invoice #{sale.invoiceNumber}
          </h1>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
            sale.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {sale.paymentStatus}
          </span>
        </div>
        <div className="flex space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePrintInvoice}
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" />
            Print
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleDownloadInvoice}
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-6">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Invoice Details</h2>
                  <p className="mt-1 text-sm text-gray-500">Invoice #{sale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateTime(sale.createdAt)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bill From</h3>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">Your Company Name</p>
                      <p className="text-sm text-gray-500">123 Business Street</p>
                      <p className="text-sm text-gray-500">City, State, Pincode</p>
                      <p className="text-sm text-gray-500">Phone: +91 1234567890</p>
                      <p className="text-sm text-gray-500">Email: contact@yourcompany.com</p>
                      <p className="text-sm text-gray-500">GSTIN: 12ABCDE1234F1Z5</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bill To</h3>
                    <div className="mt-2">
                      {sale.customer ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">{sale.customer.name}</p>
                          <p className="text-sm text-gray-500">{sale.customer.phone}</p>
                          {sale.customer.email && <p className="text-sm text-gray-500">{sale.customer.email}</p>}
                          {sale.customer.address && (
                            <p className="text-sm text-gray-500">
                              {sale.customer.address}
                              {sale.customer.city && `, ${sale.customer.city}`}
                              {sale.customer.state && `, ${sale.customer.state}`}
                              {sale.customer.pincode && ` - ${sale.customer.pincode}`}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">Walk-in Customer</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.product ? item.product.name : 'Unknown Product'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {sale.notes && (
            <Card title="Notes">
              <div className="p-6">
                <p className="text-sm text-gray-600">{sale.notes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <Card title="Payment Summary">
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(sale.subTotal)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                </div>
              )}

              {sale.tax > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">+{formatCurrency(sale.tax)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Payment Information">
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{sale.paymentMethod}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-medium ${
                  sale.paymentStatus === 'Paid' ? 'text-green-600' :
                  sale.paymentStatus === 'Pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {sale.paymentStatus}
                </span>
              </div>

              {sale.paymentStatus === 'Pending' && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="success"
                    fullWidth
                  >
                    Mark as Paid
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end space-x-3">
            <Link to="/sales">
              <Button type="button" variant="outline">
                Back to Sales
              </Button>
            </Link>
            <Link to="/sales/new">
              <Button type="button" variant="primary">
                New Sale
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;