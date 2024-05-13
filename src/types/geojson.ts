import { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';

interface Properties {
    geoid: string;
}

export type PolygonCollection = FeatureCollection<Polygon, Properties>;

export type PolygonFeature = Feature<Polygon, Properties>;