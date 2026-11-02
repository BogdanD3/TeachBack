import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // e2e runs use their own build dir so they never collide with a developer's `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
