/** @type {import('next').NextConfig} */
const configuredBackendUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === 'production' && !configuredBackendUrl) {
  throw new Error(
    'Set BACKEND_URL to the deployed HTTPS API before building for production.',
  );
}

const rawBackendUrl =
  configuredBackendUrl ||
  'http://localhost:4000';

const parsedBackendUrl = new URL(
  rawBackendUrl.trim().startsWith('http')
    ? rawBackendUrl.trim()
    : `https://${rawBackendUrl.trim()}`,
);

if (!['http:', 'https:'].includes(parsedBackendUrl.protocol)) {
  throw new Error('The backend URL must use HTTP or HTTPS.');
}

if (
  process.env.NODE_ENV === 'production' &&
  parsedBackendUrl.protocol !== 'https:'
) {
  throw new Error('The production backend URL must use HTTPS.');
}

const backendUrl = parsedBackendUrl.toString().replace(/\/+$/, '');

// Safely parse backend domain for next/image remotePatterns
const remotePatterns = [
  // Cloudinary
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '/**',
  },
  // Local development backend
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '4000',
    pathname: '/uploads/**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '4000',
    pathname: '/uploads/**',
  },
];

if (!['localhost', '127.0.0.1'].includes(parsedBackendUrl.hostname)) {
  remotePatterns.push({
    protocol: parsedBackendUrl.protocol.replace(':', ''),
    hostname: parsedBackendUrl.hostname,
    port: parsedBackendUrl.port || undefined,
    pathname: '/uploads/**',
  });
}

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },

  images: {
    // Allow inline SVG data URIs used as placeholders when venues have no image
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns,
  },

  // Forward /api and /uploads calls to the backend both in dev and prod
  async rewrites() {
    if (!backendUrl) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
