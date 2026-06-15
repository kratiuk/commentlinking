import * as esbuild from "esbuild";
import { tsconfigPathsPlugin } from "esbuild-plugin-tsconfig-paths";
import { glob } from "node:fs/promises";

const entryPoints = await Array.fromAsync(glob("tests/**/*.test.ts"));

await esbuild.build({
  entryPoints,
  bundle: true,
  outdir: "tests/out",
  outbase: "tests",
  platform: "node",
  format: "cjs",
  target: "node16",
  sourcemap: true,
  external: ["vscode"],
  tsconfig: "tsconfig.json",
  plugins: [tsconfigPathsPlugin()],
});
