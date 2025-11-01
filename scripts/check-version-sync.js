const fs = require("fs");
const { execSync } = require("child_process");

try {
  // Get staged version from package.json (what will be committed)
  let stagedVersion = "";
  try {
    const stagedPackageContent = execSync("git show :package.json", {
      encoding: "utf8",
    });
    const stagedPackage = JSON.parse(stagedPackageContent);
    stagedVersion = stagedPackage.version;
  } catch (error) {
    // No staged package.json, use current version
    const currentPackage = JSON.parse(
      fs.readFileSync("./package.json", "utf8")
    );
    stagedVersion = currentPackage.version;
  }

  // Get version from the previous commit (HEAD)
  let prevVersion = "";
  try {
    const prevPackageContent = execSync("git show HEAD:package.json", {
      encoding: "utf8",
    });
    const prevPackage = JSON.parse(prevPackageContent);
    prevVersion = prevPackage.version;
  } catch (error) {
    // No previous commit or package.json doesn't exist in previous commit
    prevVersion = "";
  }

  // Get commit message from file passed as argument (by commit-msg hook)
  let commitMsg = "";
  const commitMsgFile = process.argv[2];
  if (commitMsgFile) {
    try {
      commitMsg = fs.readFileSync(commitMsgFile, "utf8").trim();
    } catch (error) {
      console.error("❌ Could not read commit message file:", error.message);
      process.exit(1);
    }
  } else {
    console.error("❌ No commit message file provided");
    process.exit(1);
  }

  // Extract version from commit message (pattern: v1.2.3)
  const versionPattern = /v(\d+\.\d+\.\d+)/;
  const msgVersionMatch = commitMsg.match(versionPattern);
  const msgVersion = msgVersionMatch ? msgVersionMatch[1] : "";

  // Check if package.json version changed (compare staged vs HEAD)
  const versionChanged = stagedVersion !== prevVersion && prevVersion !== "";

  // Validation logic
  if (versionChanged) {
    // If version changed in package.json, commit message must contain v<new_version>
    if (msgVersion !== stagedVersion) {
      console.error("❌ Version mismatch!");
      console.error(`   Package.json version changed to: ${stagedVersion}`);
      console.error(`   But commit message should contain: v${stagedVersion}`);
      console.error(`   Current commit message: ${commitMsg}\n`);
      process.exit(1);
    }
  } else if (msgVersion) {
    // If commit message contains version, package.json must match
    if (msgVersion !== stagedVersion) {
      console.error("❌ Version mismatch!");
      console.error(`   Commit message contains: v${msgVersion}`);
      console.error(`   But package.json version is: ${stagedVersion}`);
      console.error(`   Please update package.json version to match\n`);
      process.exit(1);
    }
  }

  console.log("✅ Version check passed!\n");
  process.exit(0);
} catch (error) {
  console.error("❌ Error checking version sync:", error.message, "\n");
  process.exit(1);
}
