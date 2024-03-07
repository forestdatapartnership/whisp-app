import { parse } from 'terraformer-wkt-parser';

export function isValidWkt(inputString: string): boolean {
    try {
        // Attempt to parse the WKT string
        const geometry = parse(inputString);
        // If parsing is successful, return true
        return true;
    } catch (error) {
        // If an error occurs, the string is not valid WKT
        return false;
    }
}