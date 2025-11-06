import * as vscode from "vscode";
import { getIgnorePatterns } from "./ignore";

// Files

// Function that finds all supported files in workspace and applies ignore patterns
export async function findAllSupportedFiles(): Promise<vscode.Uri[]> {
  // First, get ignore patterns for exclude parameter
  const excludePattern = await getIgnorePatterns();

  const patterns = getSupportedGlobPatterns();
  let allFiles: vscode.Uri[] = [];

  // Use exclude parameter to filter files during search
  const lists = await Promise.all(
    patterns.map((p) =>
      vscode.workspace.findFiles(p, excludePattern || undefined)
    )
  );

  for (const arr of lists) {
    allFiles.push(...arr);
  }

  // Remove duplicates only (no more manual filtering needed)
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

export function isSupportedDocument(doc: vscode.TextDocument): boolean {
  const fileName = doc.fileName;
  const extension = fileName.split(".").pop() || "";

  return getAllSupportedExtensions().includes(extension);
}

export const SUPPORTED_EXTENSIONS: string[] = [
  "js",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rs",
  "go",
  "c",
  "cpp",
  "cxx",
  "cc",
  "hpp",
  "h",
  "cs",
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

export function isCommentLine(
  doc: vscode.TextDocument,
  lineNumber: number
): boolean {
  const text = doc.lineAt(lineNumber).text;
  const trimmed = text.trim();
  const fileName = doc.fileName;
  const extension = fileName.split(".").pop() || "";
  const commentType = getCommentTypeForExtension(extension);

  // Get standard comment prefixes
  const commentPrefixes = getCommentPrefixesForDocument(doc);

  // Check standard comment prefixes
  const hasStandardPrefix = commentPrefixes.some((prefix) =>
    trimmed.startsWith(prefix)
  );

  if (hasStandardPrefix) return true;

  // Special handling for Python docstrings
  if (commentType === "python") {
    // Check if we're inside a docstring
    return isInsidePythonDocstring(doc, lineNumber);
  }

  return false;
}

function isInsidePythonDocstring(
  doc: vscode.TextDocument,
  lineNumber: number
): boolean {
  // Look backwards to find the start of a docstring
  let docstringStart = -1;
  let docstringQuotes = "";

  for (let i = lineNumber; i >= 0; i--) {
    const lineText = doc.lineAt(i).text;
    const trimmed = lineText.trim();

    // Check for docstring start patterns
    if (trimmed.includes('"""') || trimmed.includes("'''")) {
      const tripleDoubleIndex = lineText.indexOf('"""');
      const tripleSingleIndex = lineText.indexOf("'''");

      // Find which comes first (or only one exists)
      let quoteIndex = -1;
      let quotes = "";

      if (
        tripleDoubleIndex !== -1 &&
        (tripleSingleIndex === -1 || tripleDoubleIndex < tripleSingleIndex)
      ) {
        quoteIndex = tripleDoubleIndex;
        quotes = '"""';
      } else if (tripleSingleIndex !== -1) {
        quoteIndex = tripleSingleIndex;
        quotes = "'''";
      }

      if (quoteIndex !== -1) {
        // Check if this is an opening quote (not preceded by the same quotes)
        const beforeQuotes = lineText.substring(0, quoteIndex);
        if (!beforeQuotes.includes(quotes)) {
          docstringStart = i;
          docstringQuotes = quotes;
          break;
        }
      }
    }
  }

  if (docstringStart === -1) return false;

  // Look forward from docstring start to find the end
  for (let i = docstringStart; i < doc.lineCount; i++) {
    const lineText = doc.lineAt(i).text;

    // Skip the opening line if it only contains the opening quotes
    if (i === docstringStart) {
      const openingIndex = lineText.indexOf(docstringQuotes);
      const afterOpening = lineText.substring(openingIndex + 3);

      // If the line has closing quotes too (single-line docstring), check if target is on this line
      if (afterOpening.includes(docstringQuotes)) {
        return lineNumber === docstringStart;
      }
      continue;
    }

    // Look for closing quotes
    if (lineText.includes(docstringQuotes)) {
      // Found the end of docstring
      return lineNumber <= i && lineNumber >= docstringStart;
    }

    // If we've passed our target line without finding the end, we're inside
    if (i > lineNumber) {
      return true;
    }
  }

  return false;
}

export function getCommentTypeForExtension(
  extension: string
):
  | "js"
  | "python"
  | "rust"
  | "go"
  | "c"
  | "cpp"
  | "csharp"
  | "json"
  | "markdown"
  | null {
  if (["js", "ts", "tsx", "jsx", "json", "jsonc"].includes(extension))
    return "js";
  if (extension === "py") return "python";
  if (extension === "rs") return "rust";
  if (extension === "go") return "go";
  if (extension === "c") return "c";
  if (["cpp", "cxx", "cc", "hpp", "h"].includes(extension)) return "cpp";
  if (extension === "cs") return "csharp";
  if (extension === "md") return "markdown";

  const config = vscode.workspace.getConfiguration("commentLinking");
  const customTypes = config.get<Record<string, string>>("customFileTypes", {});
  const customType = customTypes[`.${extension}`] || customTypes[extension];

  if (
    customType === "js" ||
    customType === "python" ||
    customType === "rust" ||
    customType === "go" ||
    customType === "c" ||
    customType === "cpp" ||
    customType === "csharp"
  ) {
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
      if (extension === "tsx" || extension === "jsx") {
        return ["//", "/*", "*", "{/*"];
      }
      return ["//", "/*", "*"];
    case "python":
      return ["#"];
    case "rust":
      return ["//", "/*", "*"];
    case "go":
      return ["//", "/*", "*"];
    case "c":
      return ["//", "/*", "*"];
    case "cpp":
      return ["//", "/*", "*"];
    case "csharp":
      return ["//", "/*", "*"];
    case "markdown":
      return [];
    default:
      return [];
  }
}

export function getSupportedGlobPatterns(): string[] {
  return getAllSupportedExtensions().map((ext) => `**/*.${ext}`);
}

export function getDocumentSelectorsForLinks(): vscode.DocumentSelector {
  return getAllSupportedExtensions().map(
    (ext) => ({ pattern: `**/*.${ext}` } as vscode.DocumentFilter)
  ) as vscode.DocumentSelector;
}

// Comments

export const COMMENT_PREFIXES: string[] = ["//", "#", "/*", "*", "{/*"];

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

    // Use new comment detection logic
    if (!isCommentLine(doc, line)) continue;

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

/**
 * Universal function to scan anchors from any document type
 */
export function scanUniversalAnchorMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  if (!isLegacySyntaxEnabled()) return [];

  const isMarkdown = doc.fileName.endsWith(".md");

  if (isMarkdown) {
    return scanAllLineMatches(doc, MARKDOWN_ANCHOR_REGEX);
  } else {
    return scanCommentMatches(doc, ANCHOR_LINK_REGEX);
  }
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
  const results: CommentMatch[] = [];
  for (let line = 0; line < doc.lineCount; line++) {
    const text = doc.lineAt(line).text;

    // Use new comment detection logic
    if (!isCommentLine(doc, line)) continue;
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

/**
 * Universal function to scan backlink anchors from any document type
 */
export function scanUniversalBacklinkAnchorMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  const isMarkdown = doc.fileName.endsWith(".md");

  if (isMarkdown) {
    return scanMarkdownBacklinkAnchorMatches(doc);
  } else {
    return scanBacklinkAnchorMatches(doc);
  }
}

export function scanBacklinkLinkMatches(
  doc: vscode.TextDocument
): CommentMatch[] {
  return scanBacklinkMatches(doc, BACKLINK_LINK_REGEX, true);
}
