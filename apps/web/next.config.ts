import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@comicomania/ui", "@comicomania/domain", "@comicomania/authz"],
  experimental: { typedRoutes: true },
};

export default config;
