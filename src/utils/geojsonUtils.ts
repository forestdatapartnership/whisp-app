import { hint } from '@mapbox/geojsonhint';
import { getGeoid } from "./assetRegistry";
import { Geometry, Feature, FeatureCollection, GeometryObject, Point, Polygon, GeoJsonProperties } from 'geojson';
import { getIssues } from '@placemarkio/check-geojson'

async function addGeoIdFeature(feature: Feature): Promise<any | null> {

    const geoid = await getGeoid(feature.geometry)

    if (!geoid) {
        console.error('Error obtaining geoid. There may be a problem with your input.');
    }

    return {
        type: 'Feature',
        properties: { ...feature.properties, ...{ geoid: geoid ? geoid : 'na' } },
        geometry: feature.geometry
    };
}

export const validateGeoJSON = (geojson: string) => {
    const ignoredErrors = [
        '"properties" member required',
        'Polygons and MultiPolygons should follow the right-hand rule',
        'The properties member is missing.',
        'This GeoJSON object requires a properties member but it is missing.'
    ];

    const errors = getIssues(geojson).filter(error => 
        !ignoredErrors.some(ignoredError => error.message.includes(ignoredError))
    );

    return errors;
};

export async function addGeoId(geojson: any): Promise<any> {
    switch (geojson.type) {
        case 'FeatureCollection':
            const featuresWithGeoId = await Promise.all(geojson.features.map((feature: any) => addGeoIdFeature(feature)));
            return {
                type: 'FeatureCollection',
                features: featuresWithGeoId
            }
        case 'Feature':
            return addGeoIdFeature(geojson);
        default:
            throw new Error(`Unsupported geometry type: ${geojson.type}`);
    }
}


function extractFeatures(geometry: GeometryObject | any, features: any[]): void {
    if (geometry.type === 'Polygon') {
        features.push({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: geometry.coordinates.map((ring: number[][]) =>
                    ring.map((coord: number[]) => coord.slice(0, 2))
                )
            }
        });
    } else if (geometry.type === 'Point') {
        features.push({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: geometry.coordinates.slice(0, 2)
            }
        });
    } else if (geometry.type === 'MultiPoint') {
        geometry.coordinates.forEach((point: number[]) => {
            features.push({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: point.slice(0, 2)
                }
            })
        })
    }
    else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon: number[][][]) => {
            features.push({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: polygon.map((ring: number[][]) =>
                        ring.map((coord: number[]) => coord.slice(0, 2))
                    )
                }
            });
        });
    } else if (geometry.type === 'GeometryCollection') {
        geometry.geometries.forEach((geom: any) => {
            extractFeatures(geom, features);
        });
    } else if (geometry.type === 'Feature') {
        extractFeatures(geometry.geometry, features);
    } else if (geometry.type === 'FeatureCollection') {
        geometry.features.forEach((feature: any) => {
            extractFeatures(feature, features);
        });
    }
}

export function createFeatureCollection(geojson: any): any {
    let features: Feature[] = [];
    extractFeatures(geojson, features);
    return {
        type: 'FeatureCollection',
        features: features
    };
}

interface ExtendedGeoJsonProperties {
    [key: string]: any;
  }
  
  // Function to add a new property to each feature in a FeatureCollection
export function addPropertyToFeatures(
    featureCollection: FeatureCollection<Geometry, GeoJsonProperties>,
    propertyName: string,
    propertyValue: any
  ): FeatureCollection<Geometry, ExtendedGeoJsonProperties> {
    const modifiedFeatures = featureCollection.features.map(feature => {
      // Ensure properties exist
      const properties = feature.properties || {};
      // Add new property
      properties[propertyName] = propertyValue;
  
      // Return a new feature object with updated properties
      return {
        ...feature,
        properties: properties
      } as Feature<Geometry, ExtendedGeoJsonProperties>;
    });
  
    // Return the new FeatureCollection with modified features
    return {
      ...featureCollection,
      features: modifiedFeatures
    };
  }
  
