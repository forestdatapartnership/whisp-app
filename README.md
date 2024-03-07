# Whisp: Geospatial Analysis Tool for Zero-Deforestation Claims

## Overview

Whisp is a powerful tool designed to support environmental conservation efforts by providing robust geospatial analysis. By ingesting geoids and geometries in either WKT (Well-Known Text) or GeoJSON formats, Whisp facilitates the creation of comprehensive supporting documentation necessary for claims under zero-deforestation regulatory mechanisms. This documentation can play a crucial role in validating efforts towards sustainability and compliance with environmental standards.

## Features

- **Data Ingestion:** Accepts geoids and geometries in WKT or GeoJSON formats.
- **Geospatial Analysis:** Performs advanced analysis to support zero-deforestation claims.
- **User-Friendly Interface:** Built with Next.js 14, offering a seamless and intuitive user experience.

## Getting Started

To get started with Whisp, ensure you have [Node.js](https://nodejs.org) installed on your system. We assume you are a registered user in [Asset Registry](https://asset-registry.agstack.org) and [Collect Earth Online](https://app.collect.earth/). Then, follow these steps:


1. **Clone the Repository**

    ```bash
    git clone https://github.com/yourusername/whisp.git
    cd whisp
    ```

2. **Install Dependencies**

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

Built with ❤️ for the environment.
