import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Page Not Found</h1>
        <p className="mt-2 text-base text-gray-500">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Link to="/">
            <Button type="button" variant="primary">
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;