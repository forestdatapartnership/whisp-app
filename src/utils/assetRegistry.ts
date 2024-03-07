/**
 * Registers a field boundary with the asset registry service by sending a WKT (Well-Known Text) representation of the geometry.
 * The function posts the WKT string to the asset registry service endpoint and returns the response.
 * 
 * @param {string} wkt - The Well-Known Text representation of the field boundary to be registered.
 * @return {Promise<any>} - A promise that resolves with the response from the asset registry service.
 */
export const registerWkt = async (wkt: string): Promise<any> => {
  try {
    const url = `${process.env.ASSET_REGISTRY_BASE}/register-field-boundary`;
    const apiKey = process.env.API_KEY;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!url || !apiKey || !clientSecret) {
      throw new Error("Missing required environment variables.");
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'CLIENT-SECRET': clientSecret,
        'Content-Type': 'application/json', // Ensure the server expects JSON.
        'API-KEYS-AUTHENTICATION': 'true' // If this is custom logic, ensure it's needed and correctly implemented.
      },
      body: JSON.stringify({ wkt })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
    throw new Error("There was an error registering the WKT.");
  }
}


/**
 * Fetches the GeoJSON representation of a field from the asset registry service using a geoId.
 * The function sends a GET request to the asset registry service endpoint and returns the 'Geo JSON' object from the response.
 * 
 * @param {string} geoId - The unique identifier for the field to fetch its GeoJSON representation.
 * @return {Promise<any>} - A promise that resolves with the 'Geo JSON' object if successful, or logs an error and returns undefined if not.
 */
export const getJsonfromGeoId = async (geoId: string): Promise<any> => {

  try {

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
  } catch (error: any) {
    console.error(error);
    throw new Error("There was an error getting the Json from Geo Id.");
  }
}