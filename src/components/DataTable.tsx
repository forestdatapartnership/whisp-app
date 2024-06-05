import React from 'react';

const DataTable: React.FC<any> = ({ data }) => {

  // Get the columns from the keys of the first item in the data array
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const truncateString = (str: string) => {
    const limit = 20;
    if (str.length > limit) {
      return str.slice(0, limit) + '…';
    } else {
      return str;
    }
  };

  const formatValue = (column: string, value: any) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    } else if (column === 'geoid' && typeof value === 'string') {
      return truncateString(value);
    }
    return value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm divide-y">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row: any, rowIndex: any) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  {formatValue(column, row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
