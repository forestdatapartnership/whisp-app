import { registerWkt } from "./assetRegistry";
import { addPropertyToFeatures, createFeatureCollection } from "./geojsonUtils";
import wellknown from 'wellknown'

export const normalizeWkt = (wkt: string): string =>
    wkt.replace(/\s+(Z|M|ZM)(?=\s*\()/gi, '');

export const wktToFeatureCollection = async (wkt: string, generateGeoids: boolean) => {

    if (generateGeoids) {
        const data = await registerWkt(wkt);
        const { 'Geo Id': agStackGeoId, 'matched geo ids': agStackGeoIds } = data;

        if (agStackGeoId || (Array.isArray(agStackGeoIds) && agStackGeoIds.length > 0)) {
            const geoId = agStackGeoId ?? agStackGeoIds[0];
    
            const geojson = wellknown.parse(normalizeWkt(wkt));

            const featureCollection = createFeatureCollection(geojson);

            const featureCollectionWithGeoId = addPropertyToFeatures(featureCollection, "geoid", geoId);
            return featureCollectionWithGeoId;

        } else {
            console.log("No Geo ID found for the given WKT.");
            return null;
        }
    } else {
        const geojson = wellknown.parse(normalizeWkt(wkt));

        const featureCollection = createFeatureCollection(geojson);

        return featureCollection
    }
};