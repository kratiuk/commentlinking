import * as vscode from 'vscode';

// Files

export function isSupportedDocument(doc: vscode.TextDocument): boolean {
    const id = doc.languageId;
    const name = doc.fileName;

    const isJs = id === 'javascript' || name.endsWith('.js');
    const isTs = id === 'typescript' || name.endsWith('.ts');
    const isJson = id === 'json' || name.endsWith('.json');
    const isJsonc = id === 'jsonc' || name.endsWith('.jsonc');
    const isPy = id === 'python' || name.endsWith('.py');

    return isJs || isTs || isPy || isJson || isJsonc;
}

export const SUPPORTED_EXTENSIONS: string[] = ['js', 'ts', 'py', 'json', 'jsonc'];

export function getSupportedGlobPatterns(): string[] {
    return SUPPORTED_EXTENSIONS.map(ext => `**/*.${ext}`);
}

export async function findAllSupportedFiles(excludeGlob: string = '**/{node_modules,.*}/**'): Promise<vscode.Uri[]> {
    const patterns = getSupportedGlobPatterns();
    const lists = await Promise.all(patterns.map(p => vscode.workspace.findFiles(p, excludeGlob)));
    const seen = new Set<string>();
    const result: vscode.Uri[] = [];
    for (const arr of lists) {
        for (const uri of arr) {
            const key = uri.toString();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(uri);
            }
        }
    }
    return result;
}

export function getDocumentSelectorsForLinks(): vscode.DocumentSelector {
    return SUPPORTED_EXTENSIONS.map(ext => ({ pattern: `**/*.${ext}` } as vscode.DocumentFilter)) as vscode.DocumentSelector;
}

// Comments

export const COMMENT_PREFIXES: string[] = [
    '//',
    '#',
];

export function isSupportedCommentLine(text: string): boolean {
    const trimmed = text.trim();
    return COMMENT_PREFIXES.some(prefix => trimmed.startsWith(prefix));
}

// Decorations

type SuppressionPos = { uri: string; line: number; character: number } | null;

let suppressedCursorPosition: SuppressionPos = null;

export function setSuppressDecorationOnJump(uri: vscode.Uri, line: number, character: number) {
    suppressedCursorPosition = { uri: uri.toString(), line, character };
}

export function clearSuppressDecorationOnJump() {
    suppressedCursorPosition = null;
}

export function getSuppressDecorationOnJump(): SuppressionPos {
    return suppressedCursorPosition;
}

// Regex

export const ANCHOR_LINK_REGEX = /\[[^\]]+\]\(#([A-Za-z0-9_-]+)\)/g;
export const PLAIN_LINK_REGEX = /\[[^\]]+\]\(([A-Za-z0-9_-]+)\)/g;

export type CommentMatch = {
    lineNumber: number;
    columnStart: number;
    selectionStartColumn: number;
    selectionEndColumn: number;
    fullEnd: number;
    anchorId: string;
    preview: string;
};

export function scanCommentMatches(doc: vscode.TextDocument, regex: RegExp): CommentMatch[] {
    const results: CommentMatch[] = [];
    for (let line = 0; line < doc.lineCount; line++) {
        const text = doc.lineAt(line).text;
        const trimmed = text.trim();
        if (!isSupportedCommentLine(trimmed)) continue;
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
            const fullEnd = match.index + match[0].length;
            const anchorId = match[1];
            const columnStart = match.index;
            const selectionStartColumn = columnStart + 1;
            const selectionEndColumn = text.indexOf(']', selectionStartColumn);

            if (selectionEndColumn === -1) continue;

            const prefix = COMMENT_PREFIXES.find(p => trimmed.startsWith(p)) ?? '';
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
    return scanCommentMatches(doc, ANCHOR_LINK_REGEX);
}

export function scanPlainLinkMatches(doc: vscode.TextDocument): CommentMatch[] {
    return scanCommentMatches(doc, PLAIN_LINK_REGEX);
}