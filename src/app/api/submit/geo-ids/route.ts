import { NextRequest, NextResponse } from "next/server";
import { createRegistryClient } from "@/lib/assetRegistry";
import { analyzePlots } from "@/lib/analysis/analizePlots";
import { withErrorHandling } from "@/lib/middleware/withErrorHandling";
import { SystemCode } from "@/types/systemCodes";
import { withAnalysisJobJsonBody } from "@/lib/middleware/withJsonBody";
import { withAnalysisJobContext } from "@/lib/middleware/withRequestContext";
import { AnalysisJob } from "@/types/models/analysisJob";
import { withApiKey } from "@/lib/middleware/withApiKey";
import { withLogging } from "@/lib/middleware/withLogging";
import { LogFunction } from "@/lib/logger";
import { compose } from "@/lib/middleware/compose";
import { SystemError } from "@/types/systemError";
import { validateRequiredFields } from "@/lib/utils/fieldValidation";

export const POST = compose(
  withLogging,
  withErrorHandling,
  withApiKey,
  withAnalysisJobContext,
  withAnalysisJobJsonBody
)(async (req: NextRequest, context: AnalysisJob, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['geoIds']);
  
  const geoIds = body['geoIds'];
  const analysisOptions = {
    ...body.analysisOptions,
    ...(body.analysisOptions?.externalIdColumn ? {} : { externalIdColumn: 'geoid' }),
  };
  const assetRegistryOptions = body.assetRegistryOptions;

  const client = createRegistryClient();
  const resolveOpts = {
    catalog: assetRegistryOptions?.catalog ?? process.env.ASSET_REGISTRY_DEFAULT_CATALOG ?? 'geoid',
    collection: assetRegistryOptions?.collection ?? process.env.ASSET_REGISTRY_DEFAULT_COLLECTION ?? 'test_coll',
  };

  const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {
    try {
      const geoJsonFeature = await client.resolveGeoId(geoid, resolveOpts);
      if (geoJsonFeature) {
        const geoJsonGeoId = { ...geoJsonFeature, properties: { ...geoJsonFeature.properties, geoid } };
        return geoJsonGeoId;
      } else {
        return null;
      }
    } catch {
      throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE);
    }
  }));

  const missingGeoIds = geoIds.filter((geoid: string, i: number) => geoJsonArray[i] === null);
  if (missingGeoIds.length > 0) {
    throw new SystemError(SystemCode.VALIDATION_GEO_ID_NOT_FOUND, undefined, "The following GeoIDs were not found:\n" + missingGeoIds.join('\n'));
  }

  const validFeatures = geoJsonArray.filter((feature): feature is NonNullable<typeof feature> => feature !== null);

  const featureCollection = {
    type: 'FeatureCollection',
    features: validFeatures,
    ...(analysisOptions ? { analysisOptions } : {})
  };

  context.featureCount = validFeatures.length;
  context.analysisOptions = analysisOptions;

  return await analyzePlots(context, featureCollection, log, req);
});
