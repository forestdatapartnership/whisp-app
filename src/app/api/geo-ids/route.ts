import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { useBadRequestResponse, useErrorResponse } from "@/lib/hooks/responses";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { withLogging } from "@/lib/hooks/withLogging";
import { LogFunction } from "@/lib/logger";
import { compose } from "@/utils/compose";

// Create a compose function for handlers


export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  console.log(body);
  const geoIds = body['geoIds'];
  if (!geoIds || !Array.isArray(geoIds)) {
    return useBadRequestResponse('Request body is missing geoId.');
  }
  if (geoIds.length > 100) {
    return useBadRequestResponse("Your input contains more than 100 geometries, please submit 100 or less.");
  }

  const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {

    try {
      const geoJsonFeature = await getJsonfromGeoId(geoid);
      if (geoJsonFeature) {
        const geoJsonGeoId = { ...geoJsonFeature, properties: { geoid } };
        return geoJsonGeoId;
      } else {
        return "";
      }
    } catch {
      return useErrorResponse("Asset registry is currently unavailable.", 502);
    }
  }));

  if (!geoJsonArray || geoJsonArray.length === 0) {
    return useBadRequestResponse("One or more of the values submitted is not valid.");
  }

  const featureCollection = {
    type: 'FeatureCollection',
    features: geoJsonArray,
    generateGeoids: true
  };

  return await analyzePlots(featureCollection, log);
});

