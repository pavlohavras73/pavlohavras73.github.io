import type { NextConfig } from "next";

// Static export for GitHub Pages (user site → served from the domain root, so no basePath).
// trailingSlash: /lobby → out/lobby/index.html, which Pages serves without redirects.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
