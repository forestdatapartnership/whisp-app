/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/api/geojson',
        destination: '/api/submit/geojson',
        permanent: false,
      },
      {
        source: '/api/wkt',
        destination: '/api/submit/wkt',
        permanent: false,
      },
      {
        source: '/api/geo-ids',
        destination: '/api/submit/geo-ids',
        permanent: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
};

module.exports = nextConfig;

