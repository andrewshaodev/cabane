import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-panel/**",
      "**/coverage/**",
      "**/screenshots/**",
      "**/test-results/**",
      "**/.vercel/**",
      "**/.worktrees/**",
      "**/.superpowers/**",
    ],
  },
  { ...js.configs.recommended, files: ["**/*.{js,mjs,ts,tsx}"] },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: [
      "apps/**/*.{ts,tsx}",
      "packages/**/*.{ts,tsx}",
      "home/**/*.{ts,tsx}",
      "tests/*.types.ts",
    ],
  })),
  {
    files: [
      "apps/**/*.{ts,tsx}",
      "packages/**/*.{ts,tsx}",
      "home/**/*.{ts,tsx}",
      "tests/*.types.ts",
    ],
    languageOptions: {
      parserOptions: { project: "./tsconfig.json", tsconfigRootDir: process.cwd() },
    },
    plugins: { "react-hooks": hooks },
    rules: {
      // Native TS7 and the TS6 lint API differ in contextual assertion inference.
      // The compiler remains authoritative for these assertions.
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      // Async adapters intentionally preserve Promise/error semantics even when
      // an in-memory implementation has no I/O to await.
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
  })),
  {
    files: ["**/*.mjs"],
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  prettier,
];
