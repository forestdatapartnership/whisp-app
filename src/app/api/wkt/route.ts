import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId, registerWkt } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { isValidWkt } from "@/utils/validateWkt";
import { PolygonFeature } from "@/types/geojson";
import * as wellknown from 'wellknown';
import { addPropertyToFeatures, createFeatureCollection, validateGeoJSON } from "@/utils/geojsonUtils";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useBadRequestResponse } from "@/lib/hooks/responses";
import { LogFunction } from "@/lib/logger";
import { withLogging } from "@/lib/hooks/withLogging";

const getFeaturesFromWkt = async (wkt: string, generateGeoids: boolean) => {

    if (generateGeoids) {
        const data = await registerWkt(wkt);
        const { 'Geo Id': agStackGeoId, 'matched geo ids': agStackGeoIds } = data;

        if (agStackGeoId || (Array.isArray(agStackGeoIds) && agStackGeoIds.length > 0)) {
            const geoId = agStackGeoId ?? agStackGeoIds[0];
    
            const geojson = wellknown.parse(wkt);

            const featureCollection = createFeatureCollection(geojson);

            const featureCollectionWithGeoId = addPropertyToFeatures(featureCollection, "geoid", geoId);
            return featureCollectionWithGeoId;

        } else {
            console.log("No Geo ID found for the given WKT.");
            return null;
        }
    } else {
        const geojson = wellknown.parse(wkt);

        const featureCollection = createFeatureCollection(geojson);

        return featureCollection
    }
};

export const POST = withLogging(withErrorHandling(withRequiredJsonBody(async (req: NextRequest, body: any, log: LogFunction): Promise<NextResponse> => {
    const generateGeoids = body.generateGeoids || false;
    const { wkt } = body;

    if (!wkt) return useBadRequestResponse("Missing attribute 'wkt'");
    
    const isValidWKT = isValidWkt(wkt);
    if (!isValidWKT) return useBadRequestResponse("Invalid WKT.");

    let featureCollection = await getFeaturesFromWkt(wkt, generateGeoids) as object;
    featureCollection = {...featureCollection, generateGeoids};
    return await analyzePlots(featureCollection, log); 
})));