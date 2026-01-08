const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const excludeDirs = [".git", "node_modules", "out"];
const excludeFiles = ["pnpm-lock.yaml", "LICENSE"];

const excludeListPath = path.join(
  os.tmpdir(),
  `commentlinking-cloc-exclude-${process.pid}.txt`
);

fs.writeFileSync(excludeListPath, `${excludeFiles.join("\n")}\n`, "utf8");

const result = spawnSync(
  "cloc",
  [
    ".",
    "--exclude-dir",
    excludeDirs.join(","),
    "--exclude-list-file",
    excludeListPath,
  ],
  { stdio: "inherit" }
);

fs.unlinkSync(excludeListPath);

process.exit(result.status ?? 1);
