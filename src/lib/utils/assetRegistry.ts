export const getJsonfromGeoId = async (geoId: string): Promise<any> => {
  const baseUrl = process.env.ASSET_REGISTRY_BASE;
  if (!baseUrl) {
    throw new Error("ASSET_REGISTRY_BASE is not configured.");
  }

  const response = await fetch(`${baseUrl}/fetch-field/${geoId}`, {
    method: "GET"
  });

  if (!response.ok) {
    console.error(`HTTP error from Asset Registry, status: ${response.status} and geoId ${geoId}`);
    if (response.status >= 500) {
      throw new Error("Asset registry is currently available.")
    }
    return;
  }

  const data = await response.json();

  if (data && data['Geo JSON']) {
    return data['Geo JSON'];
  } else {
    return;
  }
};
