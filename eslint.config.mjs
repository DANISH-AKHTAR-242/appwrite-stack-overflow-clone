import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,

  // Next.js rules
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // Project-specific rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],

      // React/Next.js
      "react/no-unescaped-entities": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "components/ui/**", // shadcn components
    ],
  }
);
