import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/lib/utils/assetRegistry";
import { analyzePlots } from "@/lib/utils/analizePlots";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { SystemCode } from "@/types/systemCodes";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";
import { compose } from "@/lib/utils/compose";
import { validateApiKey } from "@/lib/utils/apiKeyValidator";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {

  await validateApiKey(req);
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

  return await analyzePlots(featureCollection, log, req);
});

