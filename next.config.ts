import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent Turbopack from bundling these Node.js packages.
  // They rely on native TCP/TLS modules that must be required at runtime, not bundled.
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg", "prisma"],
};

export default nextConfig;
