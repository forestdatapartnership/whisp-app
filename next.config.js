/** @type {import('next').NextConfig} */
nextConfig = {
    async headers() {
      return [
        {
          // Apply these headers to all API routes
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          ],
        },
      ];
    },
};

module.exports = nextConfig
