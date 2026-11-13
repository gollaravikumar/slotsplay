/** @type {import('next').NextConfig} */
const rawBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');

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

if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
  try {
    const parsed = new URL(backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`);
    remotePatterns.push({
      protocol: (parsed.protocol.replace(':', '') || 'https'),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: '/uploads/**',
    });
  } catch {
    // If backendUrl is not a parseable URL, ignore safely
  }
}

const nextConfig = {
  reactStrictMode: true,

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
