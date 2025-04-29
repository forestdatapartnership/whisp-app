import * as wellknown from 'wellknown';

/**
 * Validates if a WKT string represents a valid geometry.
 * @param inputString The WKT string to validate
 * @returns boolean indicating if the WKT is valid
 */
export function isValidWkt(inputString: string): wellknown.GeoJSONGeometryOrNull {
    try {
        // Attempt to parse the WKT string
        return wellknown.parse(inputString);
    } catch (error) {
        // If an error occurs, the string is not valid WKT
        return null;
    }
}