import type { NextConfig } from "next";
import { validateProductionConfig } from "./src/config";

if (process.env.NODE_ENV === "production") {
  validateProductionConfig();
}

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    "/mcp": ["./web/dist/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
