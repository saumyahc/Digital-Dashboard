import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  ExclamationCircleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { productAPI, customerAPI, saleAPI } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    recentSales: [],
    salesByPaymentMethod: {},
    topProducts: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize default stats
        let updatedStats = {
          totalProducts: 0,
          lowStockProducts: 0,
          totalCustomers: 0,
          totalSales: 0,
          totalRevenue: 0,
          inventoryValue: 0,
          recentSales: [],
          salesByPaymentMethod: {},
          topProducts: []
        };

        // Fetch product data
        try {
          const productsRes = await productAPI.getAllProducts();
          if (productsRes && productsRes.data) {
            updatedStats.totalProducts = productsRes.data.count || 0;
          }
        } catch (err) {
          console.error('Error fetching products:', err);
        }
        
        // Set default value for low stock products
        // Temporarily bypassing the API call due to persistent errors
        updatedStats.lowStockProducts = 0;
        
        // Uncomment this block when the API is fixed
        /*
        try {
          const lowStockRes = await productAPI.getLowStockProducts();
          
          // Check if we have a valid response
          if (lowStockRes && lowStockRes.data) {
            // Try to get count from different possible response formats
            if (lowStockRes.data.data && Array.isArray(lowStockRes.data.data)) {
              updatedStats.lowStockProducts = lowStockRes.data.data.length;
            } else if (lowStockRes.data.count !== undefined) {
              updatedStats.lowStockProducts = lowStockRes.data.count;
            } else if (typeof lowStockRes.data === 'number') {
              updatedStats.lowStockProducts = lowStockRes.data;
            }
          }
        } catch (err) {
          console.error('Error fetching low stock products:', err);
          // Continue with default value already set
        }
        */
        
        // Fetch inventory value
        try {
          const inventoryValueRes = await productAPI.getInventoryValue();
          if (inventoryValueRes && inventoryValueRes.data && inventoryValueRes.data.data) {
            updatedStats.inventoryValue = inventoryValueRes.data.data.totalSellingValue || 0;
          }
        } catch (err) {
          console.error('Error fetching inventory value:', err);
        }

        // Fetch customers count
        try {
          const customersRes = await customerAPI.getAllCustomers();
          if (customersRes && customersRes.data) {
            updatedStats.totalCustomers = customersRes.data.count || 0;
          }
        } catch (err) {
          console.error('Error fetching customers:', err);
        }

        // Fetch recent sales
        try {
          const salesRes = await saleAPI.getAllSales('?limit=5&sort=-createdAt');
          if (salesRes && salesRes.data && salesRes.data.data) {
            updatedStats.recentSales = salesRes.data.data;
          }
        } catch (err) {
          console.error('Error fetching recent sales:', err);
        }
        
        // Fetch sales report data
        try {
          const salesReportRes = await saleAPI.getSalesReport();
          if (salesReportRes && salesReportRes.data && salesReportRes.data.data) {
            const reportData = salesReportRes.data.data;
            
            // Update summary data
            if (reportData.summary) {
              updatedStats.totalSales = reportData.summary.totalSales || 0;
              updatedStats.totalRevenue = reportData.summary.totalRevenue || 0;
            }
            
            // Update payment method data
            if (reportData.salesByPaymentMethod && reportData.salesByPaymentMethod.length > 0) {
              updatedStats.salesByPaymentMethod = Object.fromEntries(
                reportData.salesByPaymentMethod.map(item => [item._id, item.count])
              );
            }
            
            // Update top products data
            if (reportData.topProducts) {
              updatedStats.topProducts = reportData.topProducts;
            }
          }
        } catch (err) {
          console.error('Error fetching sales report:', err);
        }
        
        setStats(updatedStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        toast.error('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data for payment methods
  const paymentMethodChartData = {
    labels: Object.keys(stats.salesByPaymentMethod).length > 0 
      ? Object.keys(stats.salesByPaymentMethod) 
      : ['No Data'],
    datasets: [
      {
        data: Object.values(stats.salesByPaymentMethod).length > 0 
          ? Object.values(stats.salesByPaymentMethod) 
          : [1],
        backgroundColor: [
          '#4299E1', // blue
          '#48BB78', // green
          '#F6AD55', // orange
          '#F56565', // red
          '#9F7AEA', // purple
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for top products
  const topProductsChartData = {
    labels: stats.topProducts && stats.topProducts.length > 0 
      ? stats.topProducts.map(product => product.name) 
      : ['No Data'],
    datasets: [
      {
        label: 'Units Sold',
        data: stats.topProducts && stats.topProducts.length > 0 
          ? stats.topProducts.map(product => product.totalQuantity) 
          : [0],
        backgroundColor: '#4299E1',
      },
    ],
  };

  const topProductsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Selling Products',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                <dd className="flex items-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.totalProducts}</div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/products" className="font-medium text-blue-600 hover:text-blue-500">
                View all products
              </Link>
            </div>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <ExclamationCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Products</dt>
                <dd className="flex items-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.lowStockProducts}</div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/products/low-stock" className="font-medium text-yellow-600 hover:text-yellow-500">
                View low stock items
              </Link>
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                <dd className="flex items-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.totalCustomers}</div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/customers" className="font-medium text-green-600 hover:text-green-500">
                View all customers
              </Link>
            </div>
          </div>
        </Card>

        {/* Total Sales */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                <dd className="flex items-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.totalSales}</div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/sales" className="font-medium text-purple-600 hover:text-purple-500">
                View all sales
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-3xl font-semibold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <div className="mt-1 text-sm text-gray-500">Overall sales revenue</div>
            </div>
          </div>
        </Card>

        {/* Inventory Value */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Inventory Value</h3>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-3xl font-semibold text-gray-900">
                {formatCurrency(stats.inventoryValue)}
              </div>
              <div className="mt-1 text-sm text-gray-500">Total value of current stock</div>
            </div>
          </div>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Performance</h3>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <div>
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">Sales</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.totalSales || 0}
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">Low Stock</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.lowStockProducts}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <Card title="Quick Actions" className="shadow">
          <div className="p-6 flex flex-wrap gap-4">
            <Link
              to="/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CubeIcon className="-ml-1 mr-2 h-5 w-5" />
              Add New Product
            </Link>
            <Link
              to="/customers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <UsersIcon className="-ml-1 mr-2 h-5 w-5" />
              Add New Customer
            </Link>
            <Link
              to="/sales/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <ShoppingCartIcon className="-ml-1 mr-2 h-5 w-5" />
              Create New Sale
            </Link>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        <Card title="Sales by Payment Method" className="shadow">
          <div className="h-64">
            <Pie data={paymentMethodChartData} />
          </div>
        </Card>

        {/* Top Products Chart */}
        <Card title="Top Selling Products" className="shadow">
          <div className="h-64">
            <Bar data={topProductsChartData} options={topProductsChartOptions} />
          </div>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card title="Recent Sales" className="shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link to={`/sales/${sale._id}`}>{sale.invoiceNumber}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer ? sale.customer.name : 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.total || sale.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent sales found
                    <div className="mt-4">
                      <Link 
                        to="/sales/new" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Create New Sale
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right sm:px-6">
          <Link
            to="/sales"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View all sales
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;