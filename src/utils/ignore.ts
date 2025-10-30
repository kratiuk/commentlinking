import * as vscode from "vscode";

/**
 * Filters an array of files, removing those that should be ignored
 */
export async function filterIgnoredFiles(
  files: vscode.Uri[]
): Promise<vscode.Uri[]> {
  const ignorePatterns = await readIgnoreFiles();
  if (ignorePatterns.length === 0) {
    return files;
  }

  // Helper function to convert glob pattern to regex
  const patternToRegex = (pattern: string): RegExp => {
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\//g, "\\/");
    return new RegExp(
      `^${regexPattern}$|/${regexPattern}$|^${regexPattern}/|/${regexPattern}/`
    );
  };

  return files.filter((uri) => {
    const relativePath = vscode.workspace.asRelativePath(uri);
    return !ignorePatterns.some((pattern: string) => {
      const regex = patternToRegex(pattern);
      return regex.test(relativePath);
    });
  });
}

/**
 * Reads both .gitignore (if enabled) and .commentlinkingignore files.
 * .commentlinkingignore takes precedence over .gitignore patterns.
 */
async function readIgnoreFiles(): Promise<string[]> {
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
