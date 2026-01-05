import * as esbuild from "esbuild";
import { tsconfigPathsPlugin } from "esbuild-plugin-tsconfig-paths";

const isWatch = process.argv.includes("--watch");
const watchReadyToken = "[esbuild] watching";

const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  platform: "node",
  format: "cjs",
  target: "node16",
  sourcemap: true,
  external: ["vscode"],
  tsconfig: "tsconfig.json",
  plugins: [
    tsconfigPathsPlugin(),
    {
      name: "watch-ready",
      setup(build) {
        build.onEnd(() => {
          if (isWatch) {
            console.log(watchReadyToken);
          }
        });
      },
    },
  ],
};

async function run() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
  } else {
    await esbuild.build(buildOptions);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
