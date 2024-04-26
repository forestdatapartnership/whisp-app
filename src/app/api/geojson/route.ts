import { NextRequest, NextResponse } from "next/server";
import { registerWkt } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { geojsonToWKT } from "@terraformer/wkt";
import { PolygonFeature } from "@/types/geojson";
import { Feature } from "geojson";
import { hint } from '@mapbox/geojsonhint';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body) throw new Error("Required request body is missing");

        if (validateGeoJSON(JSON.stringify(body)).length > 0) {
            return NextResponse.json({ error: "There was an error with your input." }, { status: 400 })
        }
        
        const geoJson = await transformGeoJSON(body);

        if (geoJson) {
            return await analyzePlots(geoJson);
        } else {
            throw new Error("There was a problem with your input.")
        }
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: "Error in analysis. There may be a problem with your input." }, { status: 500 })
    }
}

async function transformFeature(feature: Feature): Promise<PolygonFeature | null> {
    if (feature.geometry.type !== 'Polygon') {
        console.error(`Unsupported geometry type: ${feature.geometry.type}. Feature must be a Polygon.`);
        return null; // Consider returning null or a specific error object instead of throwing an error
    }

    const geoid = await getGeoid(feature.geometry);
    if (!geoid) {
        throw new Error('Error obtaining geoid. There may be a problem with your input.');
    }

    return {
        type: 'Feature',
        properties: { ...feature.properties, geoid },
        geometry: feature.geometry
    };
}

const validateGeoJSON = (geojson: string) => {
    const errors = hint(geojson).filter(error => {
      return (!error.message.includes('"properties" member required') && !error.message.includes('Polygons and MultiPolygons should follow the right-hand rule'));
    });
    return errors;
}

async function transformGeoJSON(inputGeoJSON: any): Promise<any> {
    switch (inputGeoJSON.type) {
        case 'FeatureCollection':
            if (inputGeoJSON.features.length > 100) {
                throw new Error("The are more than 100 features in this collection. Please do not exceed more than 100 individual features.");
            }
            const transformedFeatures = await Promise.all(inputGeoJSON.features.map((feature: any) => transformFeature(feature)));
            return {
                type: 'FeatureCollection',
                features: transformedFeatures
            }
        case 'Feature':
            return transformFeature(inputGeoJSON);
        default:
            return NextResponse.json({ error: `Unsupported geometry type: ${inputGeoJSON.type}` }, { status: 400 });
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