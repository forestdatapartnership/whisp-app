import React from 'react';

interface DataItem {
  [key: string]: any;
}

interface DataTableProps {
  data: DataItem[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const columnMappings: { [key: string]: string } = {
    PLOTID: 'Plot Id',
    gaul0: 'Country',
    gaul1: 'State/Province',
    gaul2: 'County/District',
    esaTree: 'ESA Trees',
    jaxaTree: 'JAXA Trees',
    jrc2020: 'JRC GFC 2020',
    gfc2020: 'GFC Trees 2020',
    glad2020: 'GLAD Land Cover Trees 2020',
    phtf2020: 'PHTF 2020',
    wcmcpa: 'WCMC WDPA Protection',
    raddAlrt: 'RADD Alerts',
    oilpalm: 'Oil Palm',
    fdapPalm: 'FDA Palm',
    cocoaK: 'Cocoa Kalischek',
    jrcPlant: 'JRC TMF Plantations',
    jrcUndis: 'JRC TMF Undisturbed',
    geoid: 'Geo Id',
  };

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
                {columnMappings[column] || column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row, rowIndex) => (
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
