import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { isValidWkt } from "@/utils/validateWkt";
import { isValidWgs84Coordinates, coordinatesLikelyInMeters } from "@/utils/geojsonUtils";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useBadRequestResponse } from "@/lib/hooks/responses";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/utils/compose";
import { wktToFeatureCollection } from "@/utils/wktUtils";
import * as wellknown from 'wellknown';

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  const generateGeoids = body.generateGeoids || false;
  const { wkt } = body;
  const logSource = "route.ts"

  // Printing body temporarily to debug suspicious activity. 
  log("info", body, logSource);

  if (!wkt) return useBadRequestResponse("Missing attribute 'wkt'");

  // Parse WKT to GeoJSON to validate coordinates
  try {
    const geoJson = wellknown.parse(wkt);

    if (!geoJson) {
      return useBadRequestResponse("Invalid WKT. Unable to parse to GeoJSON.");
    }
    
    // Check if coordinates are in a projected system (like meters)
    if (coordinatesLikelyInMeters(geoJson)) {
      return useBadRequestResponse("Invalid coordinate reference system. Coordinates appear to be in meters rather than degrees. Please use EPSG:4326 (WGS84) coordinates.");
    }
    
    // Check if coordinates are valid WGS84 values
    if (!isValidWgs84Coordinates(geoJson)) {
      return useBadRequestResponse("Invalid coordinates. Please ensure your data is in EPSG:4326 (WGS84) coordinate reference system.");
    }
  } catch (error) {
    log("error", `Error validating WKT coordinates: ${error}`, logSource);
    return useBadRequestResponse("Error processing WKT coordinates.");
  }

  let featureCollection = await wktToFeatureCollection(wkt, generateGeoids) as object;
  featureCollection = { ...featureCollection, generateGeoids };
  return await analyzePlots(featureCollection, log);
});
