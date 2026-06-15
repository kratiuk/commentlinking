import * as assert from "assert";

import { readIgnoreFiles } from "@utils/ignore";

suite("readIgnoreFiles", () => {
  let patterns: string[];

  // Read all .gitignore files and save
  suiteSetup(async () => {
    patterns = await readIgnoreFiles();
  });

  // Checks patterns from the root .gitignore (node_modules, dist)
  test("reads root .gitignore patterns", () => {
    assert.ok(patterns.includes("node_modules"), "should include root node_modules");
    assert.ok(patterns.includes("dist"), "should include root dist");
  });

  // Expected to pass once nested .gitignore support is implemented
  test("reads nested .gitignore patterns", () => {

    assert.ok(patterns.includes("build"), "packages/ui/.gitignore was not read: 'build' missing from results");
    assert.ok(patterns.includes(".cache"), "packages/ui/.gitignore was not read: '.cache' missing from results");
    assert.ok(patterns.includes("coverage"), "packages/api/.gitignore was not read: 'coverage' missing from results");
    assert.ok(patterns.includes("tmp"), "packages/api/.gitignore was not read: 'tmp' missing from results");
  });
});
