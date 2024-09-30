import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { BaseRoute } from "@/lib/routes/BaseRoute";

export async function POST(request: NextRequest) {
    const routeHandler = new BaseRoute(request);
    const body = await routeHandler.jsonOrNull();

    if (!body) {
      return routeHandler.missingOrInvalidBodyResponse();
    }

    const geoIds = body['geoIds'];
    if (!geoIds || !Array.isArray(geoIds)) {
        return routeHandler.badRequestResponse('Request body is missing geoId.');
    }
    if (geoIds.length > 100) {
        return routeHandler.badRequestResponse("Your input contains more that 100 geometries, please submit 100 or less.");
    }

    try {
        
        const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {
            const geoJsonFeature = await getJsonfromGeoId(geoid);
            if (geoJsonFeature) {
                const geoJsonGeoId = { ...geoJsonFeature, properties: { geoid } }; 
                return geoJsonGeoId;
            }
        }));

        if (!geoJsonArray || geoJsonArray.length === 0) {
            return routeHandler.badRequestResponse("One or more of the values submitted is not valid.");
        }

        const featureCollection = {
            type: 'FeatureCollection',
            features: geoJsonArray,
            generateGeoids: true
        }

        // const formattedCollection = createFeatureCollection(geojson);

        return await analyzePlots(featureCollection);
    } catch (error: any) {
        console.error(error);
        return routeHandler.errorResponse("Internal system error. Please try again later.");
    }
}