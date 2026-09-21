import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@comicomania/ui"],
  experimental: { typedRoutes: true },
};

export default config;
