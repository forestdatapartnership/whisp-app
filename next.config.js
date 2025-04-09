/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;

