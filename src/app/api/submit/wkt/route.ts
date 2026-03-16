import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/lib/analysis/analizePlots";
import { isValidWgs84Coordinates, coordinatesLikelyInMeters } from "@/lib/utils/geojsonUtils";
import { withErrorHandling } from "@/lib/middleware/withErrorHandling";
import { withAnalysisJobJsonBody } from "@/lib/middleware/withJsonBody";
import { withAnalysisJobContext } from "@/lib/middleware/withRequestContext";
import { AnalysisJob } from "@/types/models/analysisJob";
import { withApiKey } from "@/lib/middleware/withApiKey";
import { SystemCode } from "@/types/systemCodes";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/middleware/withLogging";
import { compose } from "@/lib/middleware/compose";
import { wktToFeatureCollection, normalizeWkt } from "@/lib/utils/wktUtils";
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


  const geoJson = wellknown.parse(normalizeWkt(wkt));

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

  const featureCollection = await wktToFeatureCollection(wkt, generateGeoids) as any;
  if (!featureCollection || !featureCollection.features?.length) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_WKT);
  }
  let payload = { ...featureCollection, generateGeoids };
  if (analysisOptions) {
    payload = { ...payload, analysisOptions };
  }
  
  context.featureCount = payload.features.length;
  context.analysisOptions = analysisOptions;
  
  return await analyzePlots(context, payload, log, req);
});
