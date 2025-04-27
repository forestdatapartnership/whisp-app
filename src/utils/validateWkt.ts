import * as wellknown from 'wellknown';

/**
 * Validates if a WKT string represents a valid geometry.
 * @param inputString The WKT string to validate
 * @returns boolean indicating if the WKT is valid
 */
export function isValidWkt(inputString: string): boolean {
    try {
        // Attempt to parse the WKT string
        wellknown.parse(inputString);
        return true;
    } catch (error) {
        // If an error occurs, the string is not valid WKT
        return false;
    }
}