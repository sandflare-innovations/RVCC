import js from "@eslint/js";
import tseslint from "typescript-eslint";
import turboPlugin from "eslint-plugin-turbo";
import importPlugin from "eslint-plugin-import";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Industrial Boundaries
      "import/no-relative-packages": "error",
      "import/no-self-import": "error",
      "import/no-cycle": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/app"],
              message: "Avoid importing from the 'app' directory inside components. Use props or shared types instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Node CLI scripts and config files run outside the browser, so process,
    // console and friends are legitimately global there. Without this they all
    // report as no-undef and drown out real findings.
    files: ["**/scripts/**/*.{js,mjs,cjs}", "**/*.config.{js,mjs,cjs,ts}", "**/vitest.config.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      // These scripts talk to the operator; printing is the point.
      "no-console": "off",
    },
  },
  {
    // Globbed from the config file's directory (the repo root), so a bare
    // ".next/**" misses apps/*/.next — which is where the build output actually
    // lands, and linting those bundles buries real errors in thousands of lines.
    // public/ holds static assets and vendored third-party bundles such as
    // pdf.worker.min.mjs — 1390 errors of someone else's minified output.
    ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**", "**/public/**"],
  },
];
