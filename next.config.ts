import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
