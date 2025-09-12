import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  buttonClassName = '',
  showButton = true,
  buttonText = '',
  autoFocus = false,
  ...rest
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${inputClassName}`}
          placeholder={placeholder}
          autoFocus={autoFocus}
          {...rest}
        />
        {showButton && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="submit"
              className={`inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${buttonClassName}`}
            >
              {buttonText || (
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchInput;