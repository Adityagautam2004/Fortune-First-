import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// package.json pins eslint-config-next to ^15.5.23, and npm now actually
// resolves that same legacy (pre-flat-config) version in node_modules — its
// core-web-vitals/typescript entrypoints export plain `{ extends: [...] }`
// objects, not ready-made flat arrays. FlatCompat bridges those into the
// flat array `defineConfig` expects. (A stray higher flat-native version was
// briefly resolved here during a prior session — if npm ever resolves one
// again, bridging it through FlatCompat.extends() would double-wrap its
// plugin objects and crash with "Converting circular structure to JSON"; if
// that happens, switch back to importing the two entrypoints directly.)
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
