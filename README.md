# Whisp: Geospatial Analysis Tool for Zero-Deforestation Claims

## Overview

Whisp is a tool that provides a detailed geospatial analysis via Google Earth Engine (GEE) to aid in zero-deforestation claims. It ingests geometries in either WKT (Well-Known Text), GeoJSON format, or geoids from Asset Registry.  

Currently the application can be found [here](https://whisp.openforis.org/). 


## API Endpoints

### Authentication Required

All API endpoints require authentication using an API key. Include the API key in your requests using the `x-api-key` header.

### Analyze WKT
- **Method:** POST
- **URL:** `/api/submit/wkt`
- **Authentication:** API key required in header `x-api-key`
- **Summary:** Send WKT geometry and obtain JSON table containing analysis data
- **Request Body:**
  ```json
  {
    "wkt": "string"
  }
  ```
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }
  ```

### Analyze GeoJSON
- **Method:** POST
- **URL:** `/api/submit/geojson`
- **Authentication:** API key required in header `x-api-key`
- **Summary:** Send GeoJSON according to standard RFC 7946, with a FeatureCollection or a single Feature with a polygon as its geometry
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
    ]
  }
  ```
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }
  ```

### Analyze Geoids
- **Method:** POST
- **URL:** `/api/submit/geo-ids`
- **Authentication:** API key required in header `x-api-key`
- **Summary:** Send a list of geoids from Asset Registry to analyze
- **Request Body:**
  ```json 
  {
    "geoIds": ["string", "string"]
  }
  ```
- **Responses:**
  ```json
  {
    "data": {"object"},
    "token": "string"
  }
  ```

## Getting Started

To get started with Whisp, ensure you have [Node.js](https://nodejs.org), [PostgreSQL](https://www.postgresql.org/), and [Python 3.11+](https://www.python.org/downloads/) installed on your system. We assume you are a registered user in [Asset Registry](https://asset-registry.agstack.org) and [Collect Earth Online](https://app.collect.earth/). Then, follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/openforis/whisp-app.git
    cd whisp-app
    ```

2. **Install Dependencies**

    - Install the whisp Python package and other requirements
      
        ```bash
        pip install -r requirements.txt
        ```
      
    - Install project dependencies  
  
        ```bash
        npm install
        ```

3. **Set Up PostgreSQL Database**

    - Create a new PostgreSQL database for the application
    - Run the database schema scripts located in `src/db/*`
    - Create a database user with appropriate permissions

4. **Configure the Application**

    - Create a `.env.local` file for development at the root directory with the following environment variables:

        ```plaintext
        # Python Execution
        PYTHON_PATH=/path/to/your/python
        
        # Asset Registry
        ASSET_REGISTRY_BASE=https://api-ar.agstack.org
        AR_API_KEY=
        AR_CLIENT_SECRET=
        
        # PostgreSQL Database Connection
        DB_USER=postgres
        DB_HOST=localhost
        DB_NAME=whisp
        DB_PASSWORD=
        DB_PORT=5432
        
        # Authentication & Security
        JWT_SECRET=your_jwt_secret
        
        # Email Configuration (for password reset)
        EMAIL_SERVICE=smtp.example.com
        EMAIL_USER=user@example.com
        EMAIL_PASS=your_email_password
        
        # Google Maps API Key (for satellite view - with referrer restrictions)
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
        ```

    - Create a `credentials.json` in the root directory with your Google Earth Engine service account details.

5. **Create a Temp Folder**

    If not created already, create a `temp` directory at the root to store analyses locally. This folder will be used for temporary storage during the geospatial analysis process.

6. **Run the Application**

    ```bash
    npm run dev
    ```

    The application will start running on `http://localhost:3000`.

7. **Create an API Key**

    - After setting up, register a user account on the application
    - Generate an API key from your user profile
    - Use this API key for authenticated requests to the API endpoints

## API Key Authentication

All API requests now require an API key, which should be included in the `x-api-key` header. To obtain an API key:

1. Register and log in to the Whisp application
2. Navigate to your user profile
3. Generate a new API key
4. Use this key in all your API requests

Example request using curl:

```bash
curl -X POST \
  https://whisp.openforis.org/api/submit/wkt \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: your_api_key_here' \
  -d '{"wkt": "POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))"}'
```

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and create a pull request with your changes. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

Built with ❤️ for forests and biodiversity.
