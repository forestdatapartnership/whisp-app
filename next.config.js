/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },
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
    NEXT_PUBLIC_WHISP_PYTHON_VERSION: (() => {
      try {
        const fs = require('fs');
        const path = require('path');
        const content = fs.readFileSync(path.join(__dirname, 'requirements.txt'), 'utf-8');
        const line = content.split('\n').find((l) => l.trim().startsWith('openforis-whisp=='));
        return line ? (line.split('==')[1]?.trim() || 'unknown') : 'unknown';
      } catch {
        return 'unknown';
      }
    })(),
  },
};

module.exports = nextConfig;

