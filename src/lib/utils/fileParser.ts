import { isValidWkt } from './validateWkt';

const checkFileSize = (file: File) : string | undefined => {
    const maxFileSize = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB) || 0
    if (maxFileSize > 0 && file.size > maxFileSize * 1024) {
        return `The file is too large: ${(file.size/1024).toFixed(2)} KB, the maximum file size allowed is ${maxFileSize} KB.`;
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

export const parseWKTAndJSONFile = (file: File): Promise<{ wkt: string } | { json: string } | { error: string }> => {
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
                    const isValidWKT = isValidWkt(text);
                    if (!isValidWKT) {
                        resolve({ error: 'Invalid WKT format.' });
                        return;
                    }
                    resolve({wkt: text});
                } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
                    try {
                        const jsonData = JSON.parse(text);
                        //const wkt = jsonData.type === 'FeatureCollection' ? jsonData.features.map((feature: any) => geojsonToWKT(feature.geometry)) : geojsonToWKT(jsonData.geometry);
                        resolve({json: jsonData});
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
