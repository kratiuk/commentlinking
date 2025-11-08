import * as vscode from "vscode";

/**
 * Gets ignore patterns to be used as exclude parameter in vscode.workspace.findFiles()
 */
export async function getIgnorePatterns(): Promise<string> {
  const ignorePatterns = await readIgnoreFiles();
  if (ignorePatterns.length === 0) {
    return "";
  }
  // Normalize gitignore patterns to VS Code glob format
  const normalizedPatterns = ignorePatterns.flatMap(normalizePattern);

  // If only one pattern, return it directly; otherwise wrap in braces
  if (normalizedPatterns.length === 1) {
    return normalizedPatterns[0];
  }

  // Convert patterns to VS Code exclude format
  return `{${normalizedPatterns.join(",")}}`;
}

/**
 * Reads both .gitignore (if enabled) and .commentlinkingignore files.
 * .commentlinkingignore takes precedence over .gitignore patterns.
 */
export async function readIgnoreFiles(): Promise<string[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return [];
  }

  // Get gitignore setting from VS Code configuration
  const config = vscode.workspace.getConfiguration("commentLinking");
  const useGitignore = config.get<boolean>("useGitignore", false);

  // Helper function to read ignore file
  const readFile = async (filePath: vscode.Uri): Promise<string[]> => {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      return document
        .getText()
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("#"));
    } catch {
      return [];
    }
  };

  const ignorePatterns: string[] = [];

  for (const folder of workspaceFolders) {
    // Read .gitignore first (if enabled) - lower priority
    if (useGitignore) {
      const gitIgnore = await readFile(
        vscode.Uri.joinPath(folder.uri, ".gitignore")
      );
      ignorePatterns.push(...gitIgnore);
    }

    // Read .commentlinkingignore last - higher priority, can override .gitignore
    const commentIgnore = await readFile(
      vscode.Uri.joinPath(folder.uri, ".commentlinkingignore")
    );
    ignorePatterns.push(...commentIgnore);
  }

  return ignorePatterns;
}

/**
 * [[NormalizeGitignore23456|Converts gitignore pattern to VS Code glob pattern]]
 * Handles:
 * - /pattern -> pattern (root-relative)
 * - pattern/ -> pattern, star-star/pattern (directory pattern)
 * - pattern -> star-star/pattern (match anywhere)
 */
function normalizePattern(pattern: string): string[] {
  // Remove leading slash (gitignore: /test -> vscode: test)
  if (pattern.startsWith("/")) {
    return [pattern.slice(1)];
  }

  // Remove trailing slash and match as directory (gitignore: test/ -> vscode: test, **/test)
  if (pattern.endsWith("/")) {
    const dirPattern = pattern.slice(0, -1);
    return [dirPattern, `**/${dirPattern}`];
  }

  // Match anywhere (gitignore: test -> vscode: **/test)
  return [`**/${pattern}`];
}
