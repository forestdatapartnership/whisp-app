import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/lib/utils/assetRegistry";
import { analyzePlots } from "@/lib/utils/analizePlots";
import { withAnalysisErrorHandling } from "@/lib/hooks/withErrorHandling";
import { SystemCode } from "@/types/systemCodes";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withAnalysisJobContext } from "@/lib/hooks/withRequestContext";
import { AnalysisJob } from "@/types/analysisJob";
import { withApiKey } from "@/lib/hooks/withApiKey";
import { withAnalysisLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";
import { compose } from "@/lib/utils/compose";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
  withAnalysisJobContext,
  withApiKey,
  withAnalysisLogging,
  withAnalysisErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, context: AnalysisJob, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['geoIds']);
  
  const geoIds = body['geoIds'];
  const analysisOptions = body.analysisOptions;

  const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {

    try {
      const geoJsonFeature = await getJsonfromGeoId(geoid);
      if (geoJsonFeature) {
        const geoJsonGeoId = { ...geoJsonFeature, properties: { geoid } };
        return geoJsonGeoId;
      } else {
        return null;
      }
    } catch {
      throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE);
    }
  }));

  const validFeatures = geoJsonArray.filter(feature => feature !== null);

  // TODO: misleading error message, this is returned only when all the GeoIDs are invalid, should investigate if we should allow partial processing
  if (!validFeatures || validFeatures.length === 0) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_GEOJSON, ["One or more of the GeoIDs submitted is not valid."]);
  }

  const featureCollection = {
    type: 'FeatureCollection',
    features: validFeatures,
    generateGeoids: true,
    ...(analysisOptions ? { analysisOptions } : {})
  };

  context.featureCount = validFeatures.length;
  context.analysisOptions = analysisOptions;

  return await analyzePlots(context, featureCollection, log, req);
});

