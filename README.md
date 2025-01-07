# Whisp: Geospatial Analysis Tool for Zero-Deforestation Claims

## Overview

Whisp is a tool that provides a detailed geospatial analysis via Google Earth Engine (GEE) to aid in zero-deforestation claims. It ingests geometries in either WKT (Well-Known Text) or GeoJSON format.  

Currently the application can be found [here](https://whisp.openforis.org/). 

## Endpoints

### Analyze WKT
- **Method:** POST
- **URL:** `https://whisp.openforis.org/api/wkt`
- **Summary:** Send wkt geometry and obtain JSON table containing data
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
- **URL:** `https://whisp.openforis.org/api/geojson`
- **Summary:** Send geojson according to standard RFC 7946, with a FeatureCollection or a single Feature with a polygon as its geometry, comes back with JSON table containing data for each individual polygon detected 
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
        pip install - r requirements.txt
        ```
      
    - Install project dependencies  
  
        ```bash
        npm install
        ```

3. **Configure the Application**

    - Create a `.env.local` file for development at the root directory with the following environment variables:

        ```plaintext
        PYTHON_PATH=
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
