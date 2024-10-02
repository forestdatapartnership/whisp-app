import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { validateGeoJSON, createFeatureCollection, addGeoId } from "@/utils/geojsonUtils";
import { GEOMETRY_LIMIT } from "@/utils/constants";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withRequiredJsonBody } from "@/lib/hooks/withRequiredJsonBody";
import { useBadRequestResponse } from "@/lib/hooks/responses";

export const POST = withErrorHandling(withRequiredJsonBody(async (req: NextRequest, body: any): Promise<NextResponse> => {
    const generateGeoids = body.generateGeoids || false;

    // const errors = validateGeoJSON(JSON.stringify(body));   

    // if (errors.length > 0) {
    //     return NextResponse.json({ error: JSON.stringify(errors) }, { status: 400 })
    // }

    let featureCollection = createFeatureCollection(body);

    if (featureCollection.features.length > GEOMETRY_LIMIT) {
        return useBadRequestResponse(`The are more than ${GEOMETRY_LIMIT} features in this collection. Please do not exceed more than ${GEOMETRY_LIMIT} individual features.`);
    }

    if (generateGeoids) {
        featureCollection = await addGeoId(featureCollection);
    }

    featureCollection = {...featureCollection, generateGeoids};

    return await analyzePlots(featureCollection);
}));