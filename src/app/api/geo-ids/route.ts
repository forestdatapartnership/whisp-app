import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getJsonfromGeoId } from "@/utils/assetRegistry";
import { analyze } from "@/utils/runPython";
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
                throw new Error("One or more of the values submitted is not valid.")
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

            // const token = uuidv4();

            // const filePath = path.join(process.cwd(), '/temp');

            // await fs.writeFile(`${filePath}/${token}.json`, JSON.stringify(payload));

            // const analyzed = await analyze(token);

            // if (analyzed) {
            //     const data = await fs.readFile(`${filePath}/${token}-result.json`, 'utf8');
            //     const jsonData = JSON.parse(data);
            //     return NextResponse.json(
            //         { data: jsonData, token: token }
            //     )
            // } else {
            //     console.error(`Error writing ${filePath}`)
            //     throw new Error("Error writing file.")
            // }
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
    } else {
        return NextResponse.json({ error: 'Request body is missing geoId.' }, { status: 400 })
    }
}