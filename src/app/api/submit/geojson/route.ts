import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { createFeatureCollection, addGeoId, validateGeoJSON, isValidWgs84Coordinates, coordinatesLikelyInMeters } from "@/utils/geojsonUtils";
import { GEOMETRY_LIMIT } from "@/utils/constants";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useBadRequestResponse } from "@/lib/hooks/responses";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";

export const POST = compose(
    withLogging,
    withErrorHandling,
    withRequiredJsonBody
)(async (req: NextRequest, ...args): Promise<NextResponse> => {
    const [log, body] = args;
    const logSource = "geojson/route.ts";

    // API key checking is now handled by middleware
    const generateGeoids = body.generateGeoids || false;

    const geojsonErrors = validateGeoJSON(JSON.stringify(body));
    if (geojsonErrors.length > 0) {
        return useBadRequestResponse(
            `The body does not contain a valid GeoJSON. Errors:\n${geojsonErrors
                .map(error => `- ${error.message}`)
                .join('\n')}`
        );
    }

    try {
        // Check if coordinates are in a projected system (like meters)
        if (coordinatesLikelyInMeters(body)) {
            return useBadRequestResponse("Invalid coordinate reference system. Coordinates appear to be in meters rather than degrees. Please use EPSG:4326 (WGS84) coordinates.");
        }
        
        // Check if coordinates are valid WGS84 values
        if (!isValidWgs84Coordinates(body)) {
            return useBadRequestResponse("Invalid coordinates. Please ensure your data is in EPSG:4326 (WGS84) coordinate reference system.");
        }
    } catch (error) {
        log("error", `Error validating GeoJSON coordinates: ${error}`, logSource);
        return useBadRequestResponse("Error processing GeoJSON coordinates.");
    }

    let featureCollection = createFeatureCollection(body);

    if (featureCollection.features.length > GEOMETRY_LIMIT) {
        return useBadRequestResponse(`There are more than ${GEOMETRY_LIMIT} features in this collection. Please do not exceed more than ${GEOMETRY_LIMIT} individual features.`);
    }

    if (generateGeoids) {
        featureCollection = await addGeoId(featureCollection);
    }

    featureCollection = { ...featureCollection, generateGeoids };

    return await analyzePlots(featureCollection, log);
});

