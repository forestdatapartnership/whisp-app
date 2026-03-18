import { createFeatureCollection } from "./geojsonUtils";
import wellknown from 'wellknown'

export const normalizeWkt = (wkt: string): string =>
    wkt.replace(/\s+(Z|M|ZM)(?=\s*\()/gi, '');

export const wktToFeatureCollection = (wkt: string) => {
    const geojson = wellknown.parse(normalizeWkt(wkt));
    return createFeatureCollection(geojson);
};
