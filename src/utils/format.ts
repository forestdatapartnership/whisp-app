export const truncateString = (str: string) => {
    const limit = 20;
    if (str.length > limit) {
      return str.slice(0, limit) + '…';
    } else {
      return str;
    }
  };

export const formatValue = (column: string, value: any) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    } else if (column === 'geoid' && typeof value === 'string') {
      return truncateString(value);
    }
    return value;
  };