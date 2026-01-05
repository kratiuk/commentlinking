import { fileURLToPath } from "node:url";
import path from "node:path";
import eslintJs from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ["out/**", "dist/**", "node_modules/**"],
  },
  eslintJs.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      "@typescript-eslint": tseslint,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"],
        },
      },
    },
    rules: {
      ...tseslint.configs["flat/recommended-type-checked"].rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^vscode$", "^@?\\w"],
            ["^@/"],
            ["^\\.\\."],
            ["^\\./"],
            ["^\\u0000"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: ["./*", "./**", "../*", "../**"],
        },
      ],
    },
  },
];
