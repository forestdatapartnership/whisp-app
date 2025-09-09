import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/lib/utils/analizePlots";
import { 
    createFeatureCollection, 
    addGeoId, 
    validateGeoJSON, 
    isValidWgs84Coordinates, 
    coordinatesLikelyInMeters,
    validateCrs 
} from "@/lib/utils/geojsonUtils";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { validateApiKey } from "@/lib/utils/apiKeyValidator";
import { SystemError } from "@/types/systemError";
import { LogFunction } from "@/lib/logger";

export const POST = compose(
    withLogging,
    withErrorHandling,
    withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {

    await validateApiKey(req);
    
    const generateGeoids = body.generateGeoids || false;
    const analysisOptions = body.analysisOptions;

    const geojsonErrors = validateGeoJSON(JSON.stringify(body));
    if (geojsonErrors.length > 0) {
        throw new SystemError(
            SystemCode.VALIDATION_INVALID_GEOJSON,
            [geojsonErrors.map(error => `- ${error.message}`).join('\n')]
        );
    }

    // Validate CRS to ensure only EPSG:4326 is allowed
    const crsValidation = validateCrs(body);
    if (!crsValidation.isValid) {
        throw new SystemError(SystemCode.VALIDATION_INVALID_CRS);
    }

    // Check if coordinates are in a projected system (like meters)
    if (coordinatesLikelyInMeters(body)) {
        throw new SystemError(SystemCode.VALIDATION_COORDINATES_IN_METERS);
    }
    
    // Check if coordinates are valid WGS84 values
    if (!isValidWgs84Coordinates(body)) {
        throw new SystemError(SystemCode.VALIDATION_INVALID_COORDINATES);
    }

    let featureCollection = createFeatureCollection(body);

    if (generateGeoids) {
        featureCollection = await addGeoId(featureCollection);
    }

    featureCollection = { ...featureCollection, generateGeoids };
    if (analysisOptions) {
        featureCollection = { ...featureCollection, analysisOptions };
    }

    return await analyzePlots(featureCollection, log, req);
});

