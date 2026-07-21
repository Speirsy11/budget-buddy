// @boundaries-ignore shared eslint preset resolves plugins from the workspace root
import js from "@eslint/js";
// @boundaries-ignore shared eslint preset resolves plugins from the workspace root
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      // Disallow console.log - use @finance/logger instead
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**"],
  }
);
