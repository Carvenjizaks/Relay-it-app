import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude other projects from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
