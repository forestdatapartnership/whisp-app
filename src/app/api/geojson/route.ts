import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { validateGeoJSON, createFeatureCollection, addGeoId } from "@/utils/geojsonUtils";
import { GEOMETRY_LIMIT } from "@/utils/constants";
import { BaseRoute } from "@/lib/routes/BaseRoute";

export async function POST(request: NextRequest) {
    const routeHandler = new BaseRoute(request);
    const body = await routeHandler.jsonOrNull();

    if (!body) {
        return routeHandler.missingOrInvalidBodyResponse();
      }
    
    const generateGeoids = body.generateGeoids || false;

    // const errors = validateGeoJSON(JSON.stringify(body));   

    // if (errors.length > 0) {
    //     return NextResponse.json({ error: JSON.stringify(errors) }, { status: 400 })
    // }
            
    try {
        let featureCollection = createFeatureCollection(body);

        if (featureCollection.features.length > GEOMETRY_LIMIT) {
            return routeHandler.badRequestResponse(`The are more than ${GEOMETRY_LIMIT} features in this collection. Please do not exceed more than ${GEOMETRY_LIMIT} individual features.`);
        }

        if (generateGeoids) {
            featureCollection = await addGeoId(featureCollection);
        }

        featureCollection = {...featureCollection, generateGeoids};

        return await analyzePlots(featureCollection);

    } catch (error: any) {
        console.log(error);
        return routeHandler.badRequestResponse("There was a problem with your input.");
    }
}