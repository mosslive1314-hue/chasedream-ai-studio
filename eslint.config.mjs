import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
  globalIgnores([
    ".output/**",
    ".tanstack/**",
    ".next/**",
    ".workbuddy/**",
    "node_modules/**",
    "src/routeTree.gen.ts",
    "*.config.ts",
    "*.config.mjs",
    "*.config.js",
    "scripts/**",
  ]),
]);

export default eslintConfig;
