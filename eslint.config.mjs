import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // R3F scenes mutate three.js objects (camera, meshes, materials) inside useFrame by design;
    // the React Compiler immutability rule does not model that.
    files: ["components/**/three/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Static showcase sites are copied verbatim, not part of this app.
    "public/sites/**",
  ]),
]);

export default eslintConfig;
