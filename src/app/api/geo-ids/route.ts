import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";

export async function POST(request: NextRequest) {

    const body = await request.json();

    if (!body) {
        return NextResponse.json({ error: 'Missing request body' }, { status: 400 })
    }

    if (body['geoIds']) {

        const geoIds = body['geoIds'];

        try {

            if (geoIds.length > 100) {
                return NextResponse.json({ error: "Your input contains more that 100 geometries, please submit 100 or less." }, { status: 500 });
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
            return NextResponse.json({ error: "There was system error. Please try again later." }, { status: 500 });
        }
    } else {
        return NextResponse.json({ error: 'Request body is missing geoId.' }, { status: 400 })
    }
}