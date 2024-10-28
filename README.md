# Whisp: Geospatial Analysis Tool for Zero-Deforestation Claims

## Overview

Whisp is a powerful tool designed to support environmental conservation efforts by providing robust geospatial analysis. By ingesting geoids and geometries in either WKT (Well-Known Text) or GeoJSON formats, Whisp facilitates the creation of comprehensive supporting documentation necessary for claims under zero-deforestation regulatory mechanisms. This documentation can play a crucial role in validating efforts towards sustainability and compliance with environmental standards.

Currently the application can be found [here](https://whisp.openforis.org/). 

## Features

- **Data Ingestion:** Accepts geoids and geometries in WKT or GeoJSON formats.
- **Geospatial Analysis:** Performs advanced analysis to support zero-deforestation claims.
- **User-Friendly Interface:** Built with Next.js 14, offering a seamless and intuitive user experience.
- **Unique token for analysis:** Each analysis is assigned a UUID that will serve to identify it as a unique document. You may share the analysis by providing the UUID within the url route: `/results/{UUID}`
- **Optional Geo Id:** The platform allows to include the Geo Id as provided by the  [AgStack](https://agstack.org/) inititative. The selection is made by adding the `generateGeoids` flag, which will default to false if not included.


## Endpoints

### Analyze Geo IDs

- **Method:** POST
- **URL:** `https://whisp.openforis.org/api/geo-ids`
- **Summary:** Analyze Geo IDs
- **Description:** Accepts an array of Geo IDs and returns analysis results.
- **Request Body:**
  ```json
  {
    "geoIds": ["string"]
  }
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }
### Analyze WKT
- **Method:** POST
- **URL:** `https://whisp.openforis.org/api/wkt`
- **Summary:** Send wkt geometry and obtain, comes back with JSON table containing data
- **Description:** Accepts an array of Geo IDs and returns analysis results
- **Request Body:**
  ```json
  {
    "wkt": "string"
  }
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }

### Analyze GeoJson
- **Method:** POST
- **URL:** `https://whisp.openforis.org/api/wkt/geojson`
- **Summary:** Send geojson according to standard RFC 7946, with a FeatureCollection or a single Feature with a polygon as its geometry, comes back with JSON table containing data for each individual polygon detected 
- **Description:** Accepts an array of Geo IDs and returns analysis results
- **Request Body:**
  ```json 
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [longitude, latitude], [longitude, latitude], [longitude, latitude]
            ]
          ]
        }
      }
    ],
    "generateGeoids": "boolean"
  }
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }
## Getting Started

To get started with Whisp, ensure you have [Node.js](https://nodejs.org) and [Python 3.11](https://www.python.org/downloads/) installed on your system. We assume you are a registered user in [Asset Registry](https://asset-registry.agstack.org) and [Collect Earth Online](https://app.collect.earth/). Then, follow these steps:


1. **Clone the Repository**

    ```bash
    git clone https://github.com/yourusername/whisp.git
    cd whisp
    ```

2. **Install Dependencies**

    - Install Google Earth Engine library
      
        ```bash
        pip install earthengine-api --upgrade
        ```
      
    - Install project dependencies  
  
        ```bash
        npm install
        ```

3. **Configure the Application**

    - Create a `.env.local` file for development at the root directory with the following environment variables:

        ```plaintext
        PYTHON_PATH=
        ASSET_REGISTRY_BASE=https://api-ar.agstack.org
        USER_REGISTRY_BASE=https://user-registry.agstack.org
        API_KEY=
        CLIENT_SECRET=
        CEO_EMAIL=
        CEO_PASSWORD=
        ```

    - Create a `credentials.json` in the root directory with your Google Earth Engine service account details.

4. **Create a Temp Folder**

    Create a `temp` directory at the root to store analyses locally. This folder will be used for temporary storage during the geospatial analysis process.

5. **Run the Application**

    ```bash
    npm run dev
    ```

    The application will start running on `http://localhost:3000`.

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and create a pull request with your changes. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

Built with ❤️ for forests and biodiversity.
