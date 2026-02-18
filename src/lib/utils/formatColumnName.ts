const ABBREVIATIONS: Record<string, string> = {
  'def': 'Deforestation',
  'deg': 'Degradation',
  'undist': 'Undisturbed',
  'lon': 'Longitude',
  'lat': 'Latitude',
  'Ind': 'Indicator',
  'TC': 'Tree Cover',
  'treecover': 'Tree Cover',
  'nat': 'Natural',
  'reg': 'Regenerating',
  'pcrop': 'P.Crop',
  'acrop': 'A.Crop',
};

export function formatColumnName(columnName: string, customDisplayName?: string): string {
  if (customDisplayName) {
    return customDisplayName;
  }

  let result = columnName
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .replace(/_/g, ' '); // snake_case → snake case

  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    result = result.replace(regex, full);
  }

  // Title case each word
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
