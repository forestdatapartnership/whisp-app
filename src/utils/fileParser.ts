import { isValidWkt } from './validateWkt';
import { geojsonToWKT } from '@terraformer/wkt';

export const parseGeoIdFile = (file: File): Promise<string[] | { error: string }> => {
    return new Promise((resolve, reject) => {
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


export const parseWKTAndJSONFile = (file: File): Promise< object | { error: string }> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                if (file.name.endsWith('.txt')) {
                    const isValidWKT = isValidWkt(text);
                    if (!isValidWKT) {
                        resolve({ error: 'Invalid WKT format.' });
                        return;
                    }
                    resolve({wkt: text});
                } else if (file.name.endsWith('.json')) {
                    try {
                        const jsonData = JSON.parse(text);
                        const wkt = jsonData.type === 'FeatureCollection' ? jsonData.features.map((feature: any) => geojsonToWKT(feature.geometry)) : geojsonToWKT(jsonData.geometry);
                        resolve({wkt});
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
