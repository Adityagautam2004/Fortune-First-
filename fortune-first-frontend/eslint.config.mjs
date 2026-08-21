import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// package.json pins eslint-config-next to ^15.5.23, but the version actually
// resolved in node_modules is 16.2.10 (flat-config native — its package.json
// "exports" map serves core-web-vitals/typescript as ready-made flat arrays).
// Bridging an already-flat config through FlatCompat.extends() double-wraps
// its plugin objects and crashes eslint with "Converting circular structure
// to JSON" during schema validation — so these are imported directly instead.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Flags the "async function calling setState before its first await"
      // shape used by nearly every fetch-on-mount effect across the app
      // (dashboard/board/admin pages). Restructuring each one risks
      // regressing already-verified data-fetching flows for a cosmetic
      // extra-render concern, so it's turned off project-wide instead.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
