import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next-build",
  allowedDevOrigins: ["192.168.10.4", "192.168.10.5"],
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/wq-command-center",
        destination: "/voice/admin/command-center",
        permanent: true,
      },
      {
        source: "/wq-command-center/:path*",
        destination: "/voice/admin/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://challenges.cloudflare.com https://api.stripe.com",
              "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
