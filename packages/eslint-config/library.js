import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import { baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for React libraries.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const libraryConfig = [
  ...baseConfig,
  {
    plugins: {
      "react": reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
