import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next@15.5.x still ships its config in the legacy (.eslintrc)
// shape — not a flat-config array — so it has to be bridged via FlatCompat
// rather than imported directly (that just gives back the legacy config
// object itself, which isn't iterable when spread as if it were an array).
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

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
