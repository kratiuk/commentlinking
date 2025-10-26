import * as vscode from "vscode";

// Files

export function isSupportedDocument(doc: vscode.TextDocument): boolean {
  const fileName = doc.fileName;
  const extension = fileName.split(".").pop() || "";

  return getAllSupportedExtensions().includes(extension);
}

export const SUPPORTED_EXTENSIONS: string[] = [
  "js",
  "ts",
  "py",
  "json",
  "jsonc",
  "md",
];

function getCustomExtensions(): string[] {
  const config = vscode.workspace.getConfiguration("commentLinking");
  const customTypes = config.get<Record<string, string>>("customFileTypes", {});
  return Object.keys(customTypes).map((ext) =>
    ext.startsWith(".") ? ext.slice(1) : ext
  );
}

export function getAllSupportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS, ...getCustomExtensions()];
}

export function isLegacySyntaxEnabled(): boolean {
  const config = vscode.workspace.getConfiguration("commentLinking");
  return config.get<boolean>("enableLegacySyntax", false);
}

export function getCommentTypeForExtension(
  extension: string
): "js" | "python" | "json" | "markdown" | null {
  if (["js", "ts", "json", "jsonc"].includes(extension)) return "js";
  if (extension === "py") return "python";
  if (extension === "md") return "markdown";

  const config = vscode.workspace.getConfiguration("commentLinking");
  const customTypes = config.get<Record<string, string>>("customFileTypes", {});
  const customType = customTypes[`.${extension}`] || customTypes[extension];

  if (customType === "js" || customType === "python") {
    return customType;
  }

  return null;
}

export function getCommentPrefixesForDocument(
  doc: vscode.TextDocument
): string[] {
  const fileName = doc.fileName;
  const extension = fileName.split(".").pop() || "";
  const commentType = getCommentTypeForExtension(extension);

  switch (commentType) {
    case "js":
    case "json":
      return ["//"];
    case "python":
      return ["#"];
    case "markdown":
      return [];
    default:
      return [];
  }
}

export function getSupportedGlobPatterns(): string[] {
  return getAllSupportedExtensions().map((ext) => `**/*.${ext}`);
}

async function readCommentLinkingIgnore(): Promise<string[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return [];
  }

  const ignorePatterns: string[] = [];

  for (const folder of workspaceFolders) {
    const ignoreFilePath = vscode.Uri.joinPath(
      folder.uri,
      ".commentlinkingignore"
    );
    try {
      const document = await vscode.workspace.openTextDocument(ignoreFilePath);
      const content = document.getText();
      const lines = content
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith("#"));
      ignorePatterns.push(...lines);
    } catch {}
  }

  return ignorePatterns;
}

export async function isFileIgnored(uri: vscode.Uri): Promise<boolean> {
  const ignorePatterns = await readCommentLinkingIgnore();
  if (ignorePatterns.length === 0) {
    return false;
  }

  const relativePath = vscode.workspace.asRelativePath(uri);
  return ignorePatterns.some((pattern) => {
    // Simple pattern matching - support wildcards and directory matching
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\//g, "\\/");
    const regex = new RegExp(
      `^${regexPattern}$|/${regexPattern}$|^${regexPattern}/|/${regexPattern}/`
    );
    return regex.test(relativePath);
  });
}

export async function findAllSupportedFiles(
  excludeGlob: string = "**/{node_modules,.*}/**"
): Promise<vscode.Uri[]> {
  const patterns = getSupportedGlobPatterns();

  const ignorePatterns = await readCommentLinkingIgnore();

  let allFiles: vscode.Uri[] = [];

  if (ignorePatterns.length === 0) {
    const lists = await Promise.all(
      patterns.map((p) => vscode.workspace.findFiles(p, excludeGlob))
    );
    for (const arr of lists) {
      allFiles.push(...arr);
    }
  } else {
    const lists = await Promise.all(
      patterns.map((p) => vscode.workspace.findFiles(p, excludeGlob))
    );
    for (const arr of lists) {
      allFiles.push(...arr);
    }

    allFiles = allFiles.filter((uri) => {
      const relativePath = vscode.workspace.asRelativePath(uri);
      return !ignorePatterns.some((pattern) => {
        const regexPattern = pattern
          .replace(/\./g, "\\.")
          .replace(/\*/g, ".*")
          .replace(/\//g, "\\/");
        const regex = new RegExp(
          `^${regexPattern}$|/${regexPattern}$|^${regexPattern}/|/${regexPattern}/`
        );
        return regex.test(relativePath);
      });
    });
  }

  // Remove duplicates
  const seen = new Set<string>();
  const result: vscode.Uri[] = [];
  for (const uri of allFiles) {
    const key = uri.toString();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(uri);
    }
  }

  return result;
}

export function getDocumentSelectorsForLinks(): vscode.DocumentSelector {
  return getAllSupportedExtensions().map(
    (ext) => ({ pattern: `**/*.${ext}` } as vscode.DocumentFilter)
  ) as vscode.DocumentSelector;
}

// Comments

export const COMMENT_PREFIXES: string[] = ["//", "#"];

export function isSupportedCommentLine(text: string): boolean {
  const trimmed = text.trim();
  return COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

// Decorations

type SuppressionPos = { uri: string; line: number; character: number } | null;

let suppressedCursorPosition: SuppressionPos = null;

export function setSuppressDecorationOnJump(
  uri: vscode.Uri,
  line: number,
  character: number
) {
  suppressedCursorPosition = { uri: uri.toString(), line, character };
}

export function clearSuppressDecorationOnJump() {
  suppressedCursorPosition = null;
}

export function getSuppressDecorationOnJump(): SuppressionPos {
  return suppressedCursorPosition;
}

// Regex

export const MARKDOWN_ANCHOR_REGEX = /\[[^\]]+\]\(<>(#[A-Za-z0-9_-]+)\)/g;
export const MARKDOWN_LINK_REGEX = /\[[^\]]+\]\(<>([A-Za-z0-9_-]+)\)/g;

export const MARKDOWN_BACKLINK_ANCHOR_REGEX =
  /\[\[([A-Za-z0-9_-]+)\|([^\]]+)\]\]/gu;
export const MARKDOWN_BACKLINK_LINK_REGEX =
  /\[\[(#[A-Za-z0-9_-]+)\|([^\]]+)\]\]/gu;

export const ANCHOR_LINK_REGEX = /\[[^\]]+\]\(#([A-Za-z0-9_-]+)\)/g;
export const PLAIN_LINK_REGEX = /\[[^\]]+\]\(([A-Za-z0-9_-]+)\)/g;

export const BACKLINK_ANCHOR_REGEX = /\[\[([A-Za-z0-9_-]+)\|([^\]]+)\]\]/gu;
export const BACKLINK_LINK_REGEX = /\[\[(#[A-Za-z0-9_-]+)\|([^\]]+)\]\]/gu;

export type CommentMatch = {
  lineNumber: number;
  columnStart: number;
  selectionStartColumn: number;
  selectionEndColumn: number;
  fullEnd: number;
  anchorId: string;
  preview: string;
};

export function scanCommentMatches(
  doc: vscode.TextDocument,
  regex: RegExp
): CommentMatch[] {
  const commentPrefixes = getCommentPrefixesForDocument(doc);

  const results: CommentMatch[] = [];
  for (let line = 0; line < doc.lineCount; line++) {
    const text = doc.lineAt(line).text;
    const trimmed = text.trim();
    const isComment = commentPrefixes.some((prefix) =>
      trimmed.startsWith(prefix)
    );
    if (!isComment) continue;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const fullEnd = match.index + match[0].length;
      const anchorId = match[1];
      const columnStart = match.index;
      const selectionStartColumn = columnStart + 1;
      const selectionEndColumn = text.indexOf("]", selectionStartColumn);

      if (selectionEndColumn === -1) continue;

      const prefix = commentPrefixes.find((p) => trimmed.startsWith(p)) ?? "";
      const preview = trimmed.substring(prefix.length).trim();

      results.push({
        lineNumber: line,
        columnStart,
        selectionStartColumn,
        selectionEndColumn,
        fullEnd,
        anchorId,
        preview,
      });
    }
  }
  return results;
}

export function scanAnchorMatches(doc: vscode.TextDocument): CommentMatch[] {
  if (!isLegacySyntaxEnabled()) return [];
  return scanCommentMatches(doc, ANCHOR_LINK_REGEX);
}

export function scanPlainLinkMatches(doc: vscode.TextDocument): CommentMatch[] {
  if (!isLegacySyntaxEnabled()) return [];
  return scanCommentMatches(doc, PLAIN_LINK_REGEX);
}

function scanAllLineMatches(
  doc: vscode.TextDocument,
  regex: RegExp
): CommentMatch[] {
  const results: CommentMatch[] = [];
  for (let line = 0; line < doc.lineCount; line++) {
    const text = doc.lineAt(line).text;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const fullEnd = match.index + match[0].length;
      const anchorId = match[1].startsWith("#") ? match[1].slice(1) : match[1];
      const columnStart = match.index;
      const selectionStartColumn = columnStart + 1;
      const selectionEndColumn = text.indexOf("]", selectionStartColumn);
      if (selectionEndColumn === -1) continue;
      const preview = text.substring(selectionStartColumn, selectionEndColumn);
      results.push({
        lineNumber: line,
        columnStart,
        selectionStartColumn,
        selectionEndColumn,
        fullEnd,
        anchorId,
        preview,
      });
    }
  }
  return results;
}

export function scanMarkdownAnchorMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  if (!isLegacySyntaxEnabled()) return [];
  return scanAllLineMatches(doc, MARKDOWN_ANCHOR_REGEX);
}

export function scanMarkdownLinkMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  if (!isLegacySyntaxEnabled()) return [];
  return scanAllLineMatches(doc, MARKDOWN_LINK_REGEX);
}

// Markdown backlink scanning functions
function scanMarkdownBacklinkMatches(
  doc: vscode.TextDocument,
  regex: RegExp,
  isLink: boolean = false
): CommentMatch[] {
  const results: CommentMatch[] = [];
  for (let line = 0; line < doc.lineCount; line++) {
    const text = doc.lineAt(line).text;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const fullEnd = match.index + match[0].length;
      // For links, remove # to find the anchor; for anchors, keep as is
      const anchorId =
        isLink && match[1].startsWith("#") ? match[1].slice(1) : match[1];
      const preview = match[2];
      const columnStart = match.index;
      // For backlinks, we want to select the preview part
      const previewStart = text.indexOf("|", columnStart) + 1;
      const selectionStartColumn = previewStart;
      const selectionEndColumn = text.indexOf("]]", previewStart);

      if (selectionEndColumn === -1) continue;

      results.push({
        lineNumber: line,
        columnStart,
        selectionStartColumn,
        selectionEndColumn,
        fullEnd,
        anchorId,
        preview,
      });
    }
  }
  return results;
}

export function scanMarkdownBacklinkAnchorMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  return scanMarkdownBacklinkMatches(
    doc,
    MARKDOWN_BACKLINK_ANCHOR_REGEX,
    false
  );
}

export function scanMarkdownBacklinkLinkMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  return scanMarkdownBacklinkMatches(doc, MARKDOWN_BACKLINK_LINK_REGEX, true);
}

// Special function for backlink syntax scanning
function scanBacklinkMatches(
  doc: vscode.TextDocument,
  regex: RegExp,
  isLink: boolean = false
): CommentMatch[] {
  const commentPrefixes = getCommentPrefixesForDocument(doc);

  const results: CommentMatch[] = [];
  for (let line = 0; line < doc.lineCount; line++) {
    const text = doc.lineAt(line).text;
    const trimmed = text.trim();
    const isComment = commentPrefixes.some((prefix) =>
      trimmed.startsWith(prefix)
    );
    if (!isComment) continue;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const fullEnd = match.index + match[0].length;
      // For links, remove # to find the anchor; for anchors, keep as is
      const anchorId =
        isLink && match[1].startsWith("#") ? match[1].slice(1) : match[1];
      const preview = match[2];
      const columnStart = match.index;
      // For backlinks, we want to select the preview part
      const previewStart = text.indexOf("|", columnStart) + 1;
      const selectionStartColumn = previewStart;
      const selectionEndColumn = text.indexOf("]]", previewStart);

      if (selectionEndColumn === -1) continue;

      results.push({
        lineNumber: line,
        columnStart,
        selectionStartColumn,
        selectionEndColumn,
        fullEnd,
        anchorId,
        preview,
      });
    }
  }
  return results;
}

// Backlink scanning functions
export function scanBacklinkAnchorMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  return scanBacklinkMatches(doc, BACKLINK_ANCHOR_REGEX, false);
}

export function scanBacklinkLinkMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  return scanBacklinkMatches(doc, BACKLINK_LINK_REGEX, true);
}
