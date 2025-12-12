import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/lib/utils/analizePlots";
import { isValidWgs84Coordinates, coordinatesLikelyInMeters } from "@/lib/utils/geojsonUtils";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { wktToFeatureCollection } from "@/lib/utils/wktUtils";
import * as wellknown from 'wellknown';
import { validateApiKey } from "@/lib/utils/apiKeyValidator";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {

  const apiKey = await validateApiKey(req);
  validateRequiredFields(body, ['wkt']);
  
  const generateGeoids = body.generateGeoids || false;
  const analysisOptions = body.analysisOptions;
  const { wkt } = body;


  // Parse WKT to GeoJSON to validate coordinates
  const geoJson = wellknown.parse(wkt);

  if (!geoJson) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_WKT);
  }
  
  // Check if coordinates are in a projected system (like meters)
  if (coordinatesLikelyInMeters(geoJson)) {
    throw new SystemError(SystemCode.VALIDATION_COORDINATES_IN_METERS);
  }
  
  // Check if coordinates are valid WGS84 values
  if (!isValidWgs84Coordinates(geoJson)) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_COORDINATES);
  }

  let featureCollection = await wktToFeatureCollection(wkt, generateGeoids) as any;
  featureCollection = { ...featureCollection, generateGeoids };
  if (analysisOptions) {
    featureCollection = { ...featureCollection, analysisOptions };
  }
  return await analyzePlots(featureCollection, log, req, apiKey);
});
