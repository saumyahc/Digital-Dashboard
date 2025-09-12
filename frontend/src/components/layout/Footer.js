import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">OpticalShop</h3>
            <p className="text-gray-300 text-sm">
              Your one-stop solution for optical shop management. Manage inventory,
              customers, sales, and more with our comprehensive system.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/customers" className="text-gray-300 hover:text-white">
                  Customers
                </Link>
              </li>
              <li>
                <Link to="/sales" className="text-gray-300 hover:text-white">
                  Sales
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">
                <span className="font-medium">Email:</span> support@opticalshop.com
              </li>
              <li className="text-gray-300">
                <span className="font-medium">Phone:</span> +91 123-456-7890
              </li>
              <li className="text-gray-300">
                <span className="font-medium">Address:</span> 123 Main Street, City, State, 123456
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} OpticalShop Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;