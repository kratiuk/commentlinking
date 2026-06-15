import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "./out/ignore.test.js",
  workspaceFolder: "./fixtures/nested-gitignore",
  extensionDevelopmentPath: "..",
  mocha: {
    timeout: 10000,
  },
});
