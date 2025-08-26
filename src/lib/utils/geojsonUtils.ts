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

/**
 * Checks if coordinates in a geometry are likely in EPSG:4326 (WGS84).
 * @param geometry The geometry object to check
 * @returns boolean indicating if the coordinates are valid for WGS84
 */
export function isValidWgs84Coordinates(geometry: any): boolean {
    // Check if geometry is null or undefined
    if (!geometry) return false;
    
    // Extract coordinates from different geometry types
    let coordinates: number[][] = [];
    
    if (geometry.type === 'Point') {
        coordinates = [geometry.coordinates];
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
        coordinates = geometry.coordinates;
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach((ring: number[][]) => {
            coordinates = coordinates.concat(ring);
        });
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon: number[][][]) => {
            polygon.forEach((ring: number[][]) => {
                coordinates = coordinates.concat(ring);
            });
        });
    } else if (geometry.type === 'GeometryCollection') {
        return geometry.geometries.every((geom: any) => isValidWgs84Coordinates(geom));
    }
    
    // Check each coordinate to ensure it's within valid WGS84 range
    return coordinates.every((coord: number[]) => {
        const [longitude, latitude] = coord;
        // Valid longitude range: -180 to 180
        // Valid latitude range: -90 to 90
        return (
            typeof longitude === 'number' &&
            typeof latitude === 'number' &&
            longitude >= -180 && longitude <= 180 &&
            latitude >= -90 && latitude <= 90
        );
    });
}

/**
 * Checks if the values in a geometry are likely in a projected CRS (like meters).
 * @param geometry The geometry object to check
 * @returns boolean indicating if the coordinates appear to be in meters
 */
export function coordinatesLikelyInMeters(geometry: any): boolean {
    if (!geometry) return false;
    
    // Extract coordinates from different geometry types
    let coordinates: number[][] = [];
    
    if (geometry.type === 'Point') {
        coordinates = [geometry.coordinates];
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
        coordinates = geometry.coordinates;
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
        if (geometry.coordinates.length > 0 && geometry.coordinates[0].length > 0) {
            coordinates = geometry.coordinates[0].slice(0, 3); // Sample a few coordinates
        }
    } else if (geometry.type === 'MultiPolygon') {
        if (geometry.coordinates.length > 0 && geometry.coordinates[0].length > 0) {
            coordinates = geometry.coordinates[0][0].slice(0, 3); // Sample a few coordinates
        }
    }
    
    // Check if coordinates are likely in meters (values too large for degrees)
    return coordinates.some((coord: number[]) => {
        const [x, y] = coord;
        // Values significantly outside the WGS84 range indicate a projected CRS
        return (
            Math.abs(x) > 180 || 
            Math.abs(y) > 90
        );
    });
}

/**
 * Checks if the GeoJSON has a CRS property and validates if it's EPSG:4326
 * @param geojson The GeoJSON object to check
 * @returns An object with isValid boolean and message string
 */
export function validateCrs(geojson: any): { isValid: boolean; message: string } {
    // If no CRS is specified, it's valid by default (GeoJSON spec assumes WGS84)
    if (!geojson.crs) {
        return { isValid: true, message: "" };
    }

    // Check if the CRS is EPSG:4326
    if (geojson.crs.type === "name" && 
        geojson.crs.properties && 
        geojson.crs.properties.name) {
        
        const crsName = geojson.crs.properties.name.toLowerCase();
        
        // Valid EPSG:4326 CRS identifiers
        const validCrs = [
            "urn:ogc:def:crs:ogc:1.3:crs84",
            "urn:ogc:def:crs:epsg::4326",
            "urn:ogc:def:crs:epsg:4326"
        ];
        
        if (validCrs.some(valid => crsName.includes(valid) || crsName.includes("4326"))) {
            return { isValid: true, message: "" };
        }

        return {
            isValid: false,
            message: `Invalid CRS: ${geojson.crs.properties.name}. Only EPSG:4326 (WGS84) coordinate system is supported.`
        };
    }

    return {
        isValid: false,
        message: "Invalid CRS specification. Only EPSG:4326 (WGS84) coordinate system is supported."
    };
}

// Type for table data records
export type RecordData = Record<string, any>;

export const processGeoJSONData = (geoJSON: any): RecordData[] => {
  if (!geoJSON || !geoJSON.features || !Array.isArray(geoJSON.features)) {
    return [];
  }

  return geoJSON.features.map((feature: Feature<Geometry, GeoJsonProperties>) => {
    return {
      ...feature.properties,
      geometry: feature.geometry
    };
  });
};

export const validateAndProcessGeoJSON = (geoJSON: any): { data: RecordData[], error?: string } => {
  try {
    if (!geoJSON) {
      return { data: [], error: 'No data available' };
    }

    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      return { data: [], error: 'Invalid GeoJSON format: missing features array' };
    }

    if (geoJSON.features.length === 0) {
      return { data: [], error: 'No features found in GeoJSON data' };
    }

    const processedData = processGeoJSONData(geoJSON);
    return { data: processedData };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to process GeoJSON data'
    };
  }
};

