const fs = require("fs");
const path = require("path");
const tty = require("tty");

const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");
const cyrillicRegex = /[\u0400-\u04FF]/;

function continueCommit() {
  console.log("\n\n✅ Continuing with commit...\n");
  process.stdin.destroy();
  process.exit(0);
}

function cancelCommit() {
  console.log("\n\n❌ Commit cancelled\n");
  process.stdin.destroy();
  process.exit(1);
}

function checkForCyrillic() {
  try {
    const content = fs.readFileSync(changelogPath, "utf8");

    if (cyrillicRegex.test(content)) {
      console.log("\n⚠️  Cyrillic characters found in CHANGELOG.md");
      process.stdout.write("Do you want to continue with the commit? (y/n): ");

      if (!process.stdin.isTTY) {
        const { O_RDONLY, O_NOCTTY } = fs.constants;
        let fd;
        try {
          fd = fs.openSync("/dev/tty", O_RDONLY + O_NOCTTY);
        } catch (error) {
          console.error("Please run git commit from a terminal.");
          process.exit(1);
        }

        const stdin = new tty.ReadStream(fd);
        Object.defineProperty(process, "stdin", {
          configurable: true,
          enumerable: true,
          get: () => stdin,
        });
      }

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      process.stdin.on("data", (key) => {
        if (key.toLowerCase() === "y") {
          continueCommit();
        } else if (key.toLowerCase() === "n") {
          cancelCommit();
        } else if (key === "\u0003") {
          cancelCommit();
        }
      });
    } else {
      console.log("\n✅ No Cyrillic characters found in CHANGELOG.md\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n\nError reading CHANGELOG.md:", error.message, "\n");
    process.exit(1);
  }
}

checkForCyrillic();
