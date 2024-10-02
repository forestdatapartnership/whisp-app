import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { useBadRequestResponse, useErrorResponse } from "@/lib/hooks/responses";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";

export const POST = withErrorHandling(withRequiredJsonBody(async (req: NextRequest, body: any): Promise<NextResponse> => {
    const geoIds = body['geoIds'];
    if (!geoIds || !Array.isArray(geoIds)) {
        return useBadRequestResponse('Request body is missing geoId.');
    }
    if (geoIds.length > 100) {
        return useBadRequestResponse("Your input contains more that 100 geometries, please submit 100 or less.");
    }
    
    const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {
        const geoJsonFeature = await getJsonfromGeoId(geoid);
        if (geoJsonFeature) {
            const geoJsonGeoId = { ...geoJsonFeature, properties: { geoid } }; 
            return geoJsonGeoId;
        }
    }));

    if (!geoJsonArray || geoJsonArray.length === 0) {
        return useBadRequestResponse("One or more of the values submitted is not valid.");
    }

    const featureCollection = {
        type: 'FeatureCollection',
        features: geoJsonArray,
        generateGeoids: true
    }

    // const formattedCollection = createFeatureCollection(geojson);
    return await analyzePlots(featureCollection);
}));