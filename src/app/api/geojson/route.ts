import { NextRequest, NextResponse } from "next/server";
import { registerWkt } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { geojsonToWKT } from "@terraformer/wkt";
import { PolygonFeature } from "@/types/geojson";
import { Feature } from "geojson";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body) throw new Error("Required request body is missing");

        const geoJson = await transformGeoJSON(body);

        if (geoJson) {
            return await analyzePlots(geoJson);
        } else {
            throw new Error("There was a problem with your input.")
        }
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: "Error in analysis. Please try again later." }, { status: 500 })
    }
}

async function transformFeature(feature: Feature): Promise<PolygonFeature | null> {
    if (feature.geometry.type !== 'Polygon') {
        console.error(`Unsupported geometry type: ${feature.geometry.type}. Must be a Polygon.`);
        return null; // Consider returning null or a specific error object instead of throwing an error
    }

    const geoid = await getGeoid(feature.geometry);
    if (!geoid) {
        console.error(`Error obtaining geoid.`);
        throw new Error('Error obtain geoid.');
    }

    return {
        type: 'Feature',
        properties: { ...feature.properties, geoid },
        geometry: feature.geometry
    };
}


async function transformGeoJSON(inputGeoJSON: any): Promise<any> {
    switch (inputGeoJSON.type) {
        case 'FeatureCollection':
            const transformedFeatures = await Promise.all(inputGeoJSON.features.map((feature: any) => transformFeature(feature)));
            return {
                type: 'FeatureCollection',
                features: transformedFeatures
            }
        case 'Feature':
            return transformFeature(inputGeoJSON);
        default:
            throw new Error(`Unsupported geometry type: ${inputGeoJSON.type}`);
    }
}

const getGeoid = async (geoJson: any) => {
    try {
        const wkt = geojsonToWKT(geoJson);
        const data = await registerWkt(wkt);
        const { 'Geo Id': agStackGeoId, 'matched geo ids': agStackGeoIds } = data;

        if (agStackGeoId || (Array.isArray(agStackGeoIds) && agStackGeoIds.length > 0)) {
            return agStackGeoId ?? agStackGeoIds[0];;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}