/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export when explicitly building for Electron (not for dev or Vercel)
  // API routes require a server and won't work with static export
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  // Don't use trailingSlash - it can interfere with API routes
};

module.exports = nextConfig;
