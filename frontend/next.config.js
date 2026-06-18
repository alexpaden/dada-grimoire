/** @type {import('next').NextConfig} */
// Next's dev server blocks cross-origin requests for /_next/* assets (HMR, RSC)
// unless the requesting host is allow-listed. We are reached via a mapped port
// and/or the LAN IP, so allow loopback + the configured HOST_IP.
const devHost = process.env.HOST_IP || "127.0.0.1";

const nextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0", devHost],
  // No dev overlay/badge on the kiosk or the operator client.
  devIndicators: false,
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Image optimization only proxies assets served by this app's own host.
    remotePatterns: [
      { protocol: 'http', hostname: devHost },
    ],
  },
};

module.exports = nextConfig;
