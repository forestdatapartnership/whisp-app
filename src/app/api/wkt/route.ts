import { NextRequest, NextResponse } from "next/server";
import { getJsonfromGeoId, registerWkt } from "@/utils/assetRegistry";
import { analyzePlots } from "@/utils/analizePlots";
import { isValidWkt } from "@/utils/validateWkt";
import { PolygonFeature } from "@/types/geojson";

const getPlotFromWkt = async (wkt: string) => {
    const data = await registerWkt(wkt);

    const { 'Geo Id': agStackGeoId, 'matched geo ids': agStackGeoIds } = data;

    if (agStackGeoId || (Array.isArray(agStackGeoIds) && agStackGeoIds.length > 0)) {
        const geoId = agStackGeoId ?? agStackGeoIds[0];

        // Assuming getJsonfromGeoId returns a GeoJSON feature
        const feature = await getJsonfromGeoId(geoId);

        // Ensure feature is a valid GeoJSON object before modifying it
        if (feature && feature.type === 'Feature') {
            // Include geoId in the properties of the GeoJSON feature
            if (!feature.properties) {
                feature.properties = {};
            }
            feature.properties.geoid = geoId;

            return feature; // This is now a GeoJSON feature with geoId included in properties
        } else {
            console.error("The returned object from getJsonfromGeoId is not a valid GeoJSON feature.");
            return null;
        }
    } else {
        console.log("No Geo ID found for the given WKT.");
        return null;
    }
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body) throw new Error("Required request body is missing")

        const { wkt } = body

        if (!wkt) throw new Error("Missing attribute 'wkt'")

        const isValidWKT = isValidWkt(wkt);

        if (isValidWKT) {
            const feature: PolygonFeature = await getPlotFromWkt(wkt);
            return await analyzePlots(feature);
        }

    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: "Error in analysis. Please try again later." }, { status: 500 })
    }
}
