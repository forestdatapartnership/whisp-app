import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { PolygonCollection } from "@/types/geojson";

export async function POST(request: NextRequest) {

    const body = await request.json();

    if (!body) {
        return NextResponse.json({ error: 'Missing request body' }, { status: 400 })
    }

    if (body['geoIds']) {

        const geoIds = body['geoIds']

        try {

            const geoJsonArray = await Promise.all(geoIds.map(async (geoId: string) => {
                const geoJson = await getJsonfromGeoId(geoId);
                return geoJson;
            }));

            const noIssues = geoJsonArray.some((geoJson) => geoJson !== undefined)

            if (!noIssues) {
                const error = "One or more of the values submitted is not valid."
                return NextResponse.json({ error: error }, { status: 400 })
            }

            const polygonCollection: PolygonCollection = {
                type: "FeatureCollection",
                features: geoJsonArray.map((geoJson: any, index: number) => {
                    if (!geoJson.properties) {
                        geoJson.properties = {};
                    }

                    geoJson.properties.geoid = geoIds[index];

                    return geoJson;
                })
            };

            return await analyzePlots(polygonCollection);

        } catch (error: any) {
            return NextResponse.json({ error: "There was system error. Please try again later." }, { status: 500 })
        }
    } else {
        return NextResponse.json({ error: 'Request body is missing geoId.' }, { status: 400 })
    }
}