import * as vscode from "vscode";

/**
 * Reads patterns from ignore files
 *
 * Normalizes them to `VS Code` glob format and joins into a single exclude string
 */
export async function getIgnorePatterns(): Promise<string> {
  // Read raw patterns from ignore files
  const ignorePatterns = await readIgnoreFiles();
  if (ignorePatterns.length === 0) {
    return "";
  }
  // Normalize patterns to VS Code glob format
  const normalizedPatterns = ignorePatterns.flatMap(normalizePattern);

  // If only one pattern, return it directly; otherwise wrap in braces
  if (normalizedPatterns.length === 1) {
    return normalizedPatterns[0];
  }

  return `{${normalizedPatterns.join(",")}}`;
}

/**
 * Reads both `.gitignore` and `.commentlinkingignore` files
 *
 * `.commentlinkingignore` takes precedence over `.gitignore` patterns
 */
export async function readIgnoreFiles(): Promise<string[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return [];
  }

  // Get gitignore setting from VS Code configuration
  const config = vscode.workspace.getConfiguration("commentLinking");
  const useGitignore = config.get<boolean>("useGitignore", true);

  // Helper function to read ignore file
  // Using fs.readFile instead of openTextDocument to avoid stale cache issue: https://github.com/microsoft/vscode/issues/216964
  const readFile = async (filePath: vscode.Uri): Promise<string[]> => {
    try {
      const content = await vscode.workspace.fs.readFile(filePath);
      const text = new (globalThis as any).TextDecoder().decode(content);
      return text
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("#"));
    } catch {
      return [];
    }
  };

  const ignorePatterns: string[] = [];

  for (const folder of workspaceFolders) {
    if (useGitignore) {
      const gitIgnore = await readFile(
        vscode.Uri.joinPath(folder.uri, ".gitignore")
      );
      ignorePatterns.push(...gitIgnore);
    }

    const commentIgnore = await readFile(
      vscode.Uri.joinPath(folder.uri, ".commentlinkingignore")
    );
    ignorePatterns.push(...commentIgnore);

    // Local ignore file in `.git/` folder (takes highest precedence, not tracked by git)
    const localIgnore = await readFile(
      vscode.Uri.joinPath(folder.uri, ".git", ".commentlinkingignore")
    );
    ignorePatterns.push(...localIgnore);
  }

  return ignorePatterns;
}

/**
 * Converts gitignore pattern to VS Code glob pattern
 *
 * Handles:
 * - `/pattern` -> `pattern` (root-relative)
 * - `pattern/` -> `pattern`, `star-star/pattern` (directory pattern)
 * - `pattern` -> `star-star/pattern` (match anywhere)
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
