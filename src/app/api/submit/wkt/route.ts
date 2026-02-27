import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/lib/utils/analizePlots";
import { isValidWgs84Coordinates, coordinatesLikelyInMeters } from "@/lib/utils/geojsonUtils";
import { withErrorHandling } from "@/lib/api-middleware/withErrorHandling";
import { withAnalysisJobJsonBody } from "@/lib/api-middleware/withJsonBody";
import { withAnalysisJobContext } from "@/lib/api-middleware/withRequestContext";
import { AnalysisJob } from "@/types/analysisJob";
import { withApiKey } from "@/lib/api-middleware/withApiKey";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/api-middleware/withLogging";
import { compose } from "@/lib/api-middleware/compose";
import { wktToFeatureCollection } from "@/lib/utils/wktUtils";
import * as wellknown from 'wellknown';
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
  withLogging,
  withErrorHandling,
  withApiKey,
  withAnalysisJobContext,
  withAnalysisJobJsonBody
)(async (req: NextRequest, context: AnalysisJob, log: LogFunction, body: any): Promise<NextResponse> => {
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
  
  context.featureCount = featureCollection.features.length;
  context.analysisOptions = analysisOptions;
  
  return await analyzePlots(context, featureCollection, log, req);
});
