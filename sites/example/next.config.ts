import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: '/slate-canvas',
  assetPrefix: '/slate-canvas/',
};

export default nextConfig;
