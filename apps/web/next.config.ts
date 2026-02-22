import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@finance/ui",
    "@finance/auth",
    "@finance/transactions",
    "@finance/analytics",
  ],
  experimental: {
    optimizePackageImports: ["@finance/ui", "lucide-react"],
  },
};

export default nextConfig;
