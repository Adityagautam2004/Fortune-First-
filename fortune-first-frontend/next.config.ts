import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There's an unrelated stray package-lock.json/node_modules at C:\Users\adikr
  // (outside this repo). Next was walking up past this project to find a
  // lockfile and picking that one as the workspace root, which corrupted
  // module resolution during build/prerender. Pin the root explicitly.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
