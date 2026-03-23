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
import { getMaxGeometryLimit, getMaxGeometryLimitSync } from "@/lib/utils/configUtils";

const RESOLVE_CONCURRENCY = 20;

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

  const isAsync = analysisOptions?.async === true;
  const maxGeometryLimit = isAsync ? getMaxGeometryLimit() : getMaxGeometryLimitSync();
  if (geoIds.length > maxGeometryLimit) {
    throw new SystemError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [maxGeometryLimit]);
  }

  const client = createRegistryClient();
  const resolveOpts = {
    catalog: assetRegistryOptions?.catalog ?? process.env.ASSET_REGISTRY_DEFAULT_CATALOG ?? 'geoid',
    collection: assetRegistryOptions?.collection ?? process.env.ASSET_REGISTRY_DEFAULT_COLLECTION ?? 'test_coll',
  };

  const geoJsonArray: (import('geojson').Feature | null)[] = new Array(geoIds.length);
  let cursor = 0;

  async function resolveNext(index: number): Promise<void> {
    const geoid: string = geoIds[index];
    try {
      const geoJsonFeature = await client.resolveGeoId(geoid, resolveOpts);
      geoJsonArray[index] = geoJsonFeature
        ? { ...geoJsonFeature, properties: { ...geoJsonFeature.properties, geoid } }
        : null;
    } catch {
      throw new SystemError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE);
    }
  }

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= geoIds.length) break;
      await resolveNext(index);
    }
  }

  const workers = Array.from({ length: Math.min(RESOLVE_CONCURRENCY, geoIds.length) }, () => worker());
  await Promise.all(workers);

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
