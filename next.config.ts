import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const scriptSource = [
  "script-src 'self' 'unsafe-inline'",
  !isProduction ? "'unsafe-eval'" : "",
  "https://challenges.cloudflare.com",
  "https://js.stripe.com",
].filter(Boolean).join(" ");

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next-build",
  output: "standalone",
  images: {
    // The app does not accept remote image sources; disabling optimization
    // removes the native image-processing attack surface from production.
    unoptimized: true,
  },
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
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          ...(isProduction
            ? [{
                key: "Strict-Transport-Security",
                value: "max-age=31536000; includeSubDomains",
              }]
            : []),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSource,
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
