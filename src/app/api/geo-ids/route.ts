import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { PolygonCollection } from "@/types/geojson";
import { createFeatureCollection } from "@/utils/geojsonUtils";

export async function POST(request: NextRequest) {

    const body = await request.json();

    if (!body) {
        return NextResponse.json({ error: 'Missing request body' }, { status: 400 })
    }

    if (body['geoIds']) {

        const geoIds = body['geoIds'];

        try {

            if (geoIds.length > 100) {
                throw new Error("Please submit 100 individual polygons or less.");
            }
            const geoJsonArray = await Promise.all(geoIds.map(async (geoid: string) => {
                const geoJsonFeature = await getJsonfromGeoId(geoid);
                if (geoJsonFeature) {
                    const geoJsonGeoId = { ...geoJsonFeature, properties: { geoid } }; 
                    return geoJsonGeoId;
                }
            }));

            if (!geoJsonArray || geoJsonArray.length === 0) {
                const error = "One or more of the values submitted is not valid."
                return NextResponse.json({ error: error }, { status: 400 })
            }

            const featureCollection = {
                type: 'FeatureCollection',
                features: geoJsonArray,
                generateGeoids: true
            }

            // const formattedCollection = createFeatureCollection(geojson);

            return await analyzePlots(featureCollection);

        } catch (error: any) {
            return NextResponse.json({ error: "There was system error. Please try again later." }, { status: 500 })
        }
    } else {
        return NextResponse.json({ error: 'Request body is missing geoId.' }, { status: 400 })
    }
}