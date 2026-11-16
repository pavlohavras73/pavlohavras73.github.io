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
      // Keep CSS Modules as modules: a plain `as: "*.css"` would turn *.module.css into global CSS
      // (unhashed classes in the CSS, hashed ones in the HTML → no styles).
      "*.css": [
        { condition: { not: { path: /\.module\.css$/ } }, loaders: ["@tailwindcss/turbopack"], as: "*.css" },
        { condition: { path: /\.module\.css$/ }, loaders: ["@tailwindcss/turbopack"], as: "*.module.css" },
      ],
    },
  },
};

export default nextConfig;
