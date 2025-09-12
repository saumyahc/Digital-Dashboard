import React from 'react';

const Table = ({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  cellClassName = '',
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Table style classes
  const tableClasses = [
    'min-w-full divide-y divide-gray-300',
    bordered ? 'border border-gray-300' : '',
    className
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    compact ? 'px-3 py-2' : 'px-6 py-3',
    headerClassName
  ].filter(Boolean).join(' ');

  const bodyClasses = [
    'bg-white divide-y divide-gray-200',
    bodyClassName
  ].filter(Boolean).join(' ');

  const rowClasses = [
    striped ? 'even:bg-gray-50' : '',
    hoverable ? 'hover:bg-gray-100' : '',
    onRowClick ? 'cursor-pointer' : '',
    rowClassName
  ].filter(Boolean).join(' ');

  const cellClasses = [
    'text-sm text-gray-900',
    compact ? 'px-3 py-2' : 'px-6 py-4',
    cellClassName
  ].filter(Boolean).join(' ');

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={headerClasses}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClasses}>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowClasses}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={cellClasses}>
                  {column.cell ? column.cell(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;