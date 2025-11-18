import { getMaxFileSize } from './configUtils';
import * as wellknown from 'wellknown';

const checkFileSize = (file: File) : string | undefined => {
    const maxFileSizeBytes = getMaxFileSize();
    const maxFileSizeKB = maxFileSizeBytes ? maxFileSizeBytes / 1024 : 0;
    if (maxFileSizeKB > 0 && file.size > maxFileSizeBytes!) {
        return `The file is too large: ${(file.size/1024).toFixed(2)} KB, the maximum file size allowed is ${maxFileSizeKB} KB.`;
    }
};

export const parseGeoIdFile = (file: File): Promise<string[] | { error: string }> => {
    return new Promise((resolve, reject) => {
        const sizeCheckResult = checkFileSize(file);
        if (sizeCheckResult) {
            resolve({ error: sizeCheckResult });
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                // Updated regex to match commas or new lines as separators
                const isValidFormat = /^(\s*\w+\s*[\n,]?)*(\s*\w+\s*)$/.test(text);
                if (!isValidFormat) {
                    resolve({ error: 'File content must be a comma-separated set of geoids or have each geoid in a new line.' });
                    return;
                }

                // Updated split logic to split by both commas and new lines
                const dataArray: string[] = text.split(/[\n,]/).map(item => item.trim()).filter(item => item.length > 0);
                resolve(dataArray);
            }
        };

        fileReader.onerror = () => {
            resolve({ error: 'Error reading the file.' });
        };

        fileReader.readAsText(file);
    });
};

export const parseWKTAndJSONFile = (file: File): Promise<{ wkt: string; featureCount: number } | { json: string; featureCount: number } | { error: string }> => {
    return new Promise((resolve, reject) => {
        const sizeCheckResult = checkFileSize(file);
        if (sizeCheckResult) {
            resolve({ error: sizeCheckResult });
            return;
        }
        
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                if (file.name.endsWith('.txt')) {
                    let featureCount = 1;
                    try {
                        const parsed = wellknown.parse(text);
                        if (!parsed) {
                            resolve({ error: 'Invalid WKT format.' });
                            return;
                        }
                        
                        if (parsed.type === 'GeometryCollection') {
                            featureCount = parsed.geometries?.length || 1;
                        } else if (parsed.type.startsWith('Multi')) {
                            featureCount = parsed.coordinates?.length || 1;
                        }
                    } catch (e) {
                        resolve({ error: 'Invalid WKT format.' });
                        return;
                    }
                    
                    resolve({wkt: text, featureCount});
                } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
                    try {
                        const jsonData = JSON.parse(text);
                        let featureCount = 1;
                        
                        if (jsonData.type === 'FeatureCollection') {
                            featureCount = jsonData.features?.length || 0;
                        }
                        
                        resolve({json: jsonData, featureCount});
                    } catch (error) {
                        resolve({ error: 'Invalid GeoJSON format.' });
                        return;
                    }
                } else {
                    resolve({ error: 'Unsupported file format.' });
                }
            }
        };

        fileReader.onerror = () => {
            resolve({ error: 'Error reading the file.' });
        };

        fileReader.readAsText(file);
    });
};
