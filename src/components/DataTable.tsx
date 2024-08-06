import { formatValue, truncateString } from '@/utils/format';
import React from 'react';

const DataTable: React.FC<any> = ({ data }) => {

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
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
