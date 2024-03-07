import { FeatureCollection, Feature, Polygon } from 'geojson';
import { Prop } from 'types-ramda';

interface Properties {
    geoid: string;
}

export type PolygonCollection = FeatureCollection<Polygon, Properties>;

export type PolygonFeature = Feature<Polygon, Properties>;