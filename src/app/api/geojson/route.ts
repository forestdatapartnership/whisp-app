import { NextRequest, NextResponse } from "next/server";
import { analyzePlots } from "@/utils/analizePlots";
import { validateGeoJSON, createFeatureCollection, addGeoId } from "@/utils/geojsonUtils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const generateGeoids = body.generateGeoids || false;

        if (!body) throw new Error("Required request body is missing");

        // const errors = validateGeoJSON(JSON.stringify(body));   

        // if (errors.length > 0) {
        //     return NextResponse.json({ error: JSON.stringify(errors) }, { status: 400 })
        // }
                
        try {
            let featureCollection = createFeatureCollection(body);

            if (generateGeoids) {
                featureCollection = await addGeoId(featureCollection);
            }

            featureCollection = {...featureCollection, generateGeoids};

            return await analyzePlots(featureCollection);

        } catch (error: any) {
            console.log(error);
            return NextResponse.json({ error: "There was a problem with your input." }, { status: 400 });
        }

    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: "Error in analysis. There may be a problem with your input." }, { status: 500 })
    }
}

