import type { Feature } from 'geojson';
import { normalizeWkt } from './wktUtils';
import * as wellknown from 'wellknown';

export function parseGeoIdText(text: string): string[] {
    return text.split('\n').map(s => s.trim()).filter(Boolean);
}

export function parseGeoJsonFile(file: File): Promise<Feature[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                if (data?.type === 'FeatureCollection' && Array.isArray(data.features)) {
                    resolve(data.features);
                } else if (data?.type === 'Feature') {
                    resolve([data]);
                } else {
                    reject(new Error('File must be a GeoJSON FeatureCollection or Feature'));
                }
            } catch {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export const parseGeoIdFile = (file: File): Promise<string[] | { error: string }> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                // Updated regex to match commas or new lines as separators
                const isValidFormat = /^(\s*[^\s,\n]+\s*[\n,]?)*(\s*[^\s,\n]+\s*)$/.test(text);
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
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                if (file.name.endsWith('.txt')) {
                    let featureCount = 1;
                    try {
                        const parsed = wellknown.parse(normalizeWkt(text));
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
