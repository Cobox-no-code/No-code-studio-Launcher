import type { NextConfig } from "next";
const isElectron = process.env.BUILD_ELECTRON === "true";
const nextConfig: NextConfig = {
  assetPrefix: isElectron ? "./" : "",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // ⛔ disables TS build failures
  },
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
