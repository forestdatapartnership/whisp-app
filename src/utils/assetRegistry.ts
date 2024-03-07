/**
 * Registers a field boundary with the asset registry service by sending a WKT (Well-Known Text) representation of the geometry.
 * The function posts the WKT string to the asset registry service endpoint and returns the response.
 * 
 * @param {string} wkt - The Well-Known Text representation of the field boundary to be registered.
 * @return {Promise<any>} - A promise that resolves with the response from the asset registry service.
 */
export const registerWkt = async (wkt: string): Promise<any> => {
  const response = await fetch(`${process.env.ASSET_REGISTRY_BASE}/register-field-boundary`, {
    method: 'POST',
    headers: {
      'API-KEY': '4dfdecdf4e9b71aec7b9d9ed8f117d4c091765d71b641571f422f86447d5a882',
      'CLIENT-SECRET': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNzgzNTA4MSwianRpIjoiNzllN2ZkYzAtMzdhOS00YmY4LWI3NzItZjE5MjAwYWNkMzhmIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6ImdtYWlsLmNvbSIsIm5iZiI6MTcwNzgzNTA4MX0.t9U13ocUqo6NgG8LNuW07Y39nG9Cysxk4U82eoDtfos',
      'API-KEYS-AUTHENTICATION': 'true'
    },
    body: JSON.stringify({ wkt })
  });

  const data = await response.json();

  return data;
}

/**
 * Fetches the GeoJSON representation of a field from the asset registry service using a geoId.
 * The function sends a GET request to the asset registry service endpoint and returns the 'Geo JSON' object from the response.
 * 
 * @param {string} geoId - The unique identifier for the field to fetch its GeoJSON representation.
 * @return {Promise<any>} - A promise that resolves with the 'Geo JSON' object if successful, or logs an error and returns undefined if not.
 */
export const getJsonfromGeoId = async (geoId: string): Promise<any> => {

  const response = await fetch(`${process.env.ASSET_REGISTRY_BASE}/fetch-field/${geoId}`, {
    method: "GET"
  });

  if (!response.ok) {
    console.error(`HTTP error from Asset Registry, status: ${response.status} and geoId ${geoId}`);
    return
  }

  const data = await response.json();

  if (data && ['Geo JSON']) {
    return data['Geo JSON'];
  } else {
    return
  }
}