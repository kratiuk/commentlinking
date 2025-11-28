import * as vscode from "vscode";
import {
  getSuppressDecorationOnJump,
  clearSuppressDecorationOnJump,
} from "../utils/helpers";
import { anchorIndex } from "../anchors/AnchorIndex";
import {
  scanMarkdownBacklinkAnchorMatches,
  scanMarkdownBacklinkLinkMatches,
} from "../utils/helpers";
import { createDecorationTypes } from "./styles";

let decorationsBundle: ReturnType<typeof createDecorationTypes> | null = null;

function buildMarkdownDecorationRanges(
  doc: vscode.TextDocument,
  selection: vscode.Selection | undefined,
  context: vscode.ExtensionContext
) {
  if (!decorationsBundle) {
    decorationsBundle = createDecorationTypes(context);
  }
  const {
    anchorTextDecoration,
    anchorTextActiveDecoration,
    linkTextDecoration,
    linkTextActiveDecoration,
    hiddenDecoration,
  } = decorationsBundle;
  const anchorTextRanges: vscode.DecorationOptions[] = [];
  const anchorTextActiveRanges: vscode.DecorationOptions[] = [];
  const linkTextRanges: vscode.DecorationOptions[] = [];
  const linkTextActiveRanges: vscode.DecorationOptions[] = [];
  const hiddenRanges: vscode.DecorationOptions[] = [];

  const backlinkAnchorMatches = scanMarkdownBacklinkAnchorMatches(doc);
  for (const m of backlinkAnchorMatches) {
    const wordRange = new vscode.Range(
      new vscode.Position(m.lineNumber, m.selectionStartColumn),
      new vscode.Position(m.lineNumber, m.selectionEndColumn)
    );
    const pos = selection?.active;
    const suppression = getSuppressDecorationOnJump();
    let cursorInside =
      !!pos &&
      pos.line === m.lineNumber &&
      pos.character >= m.columnStart &&
      pos.character <= m.fullEnd;
    if (
      suppression &&
      suppression.uri === doc.uri.toString() &&
      suppression.line === m.lineNumber &&
      suppression.character === pos?.character
    ) {
      cursorInside = false;
    }
    if (cursorInside) {
      anchorTextActiveRanges.push({ range: wordRange });
    } else {
      anchorTextRanges.push({ range: wordRange });
      if (m.selectionStartColumn > m.columnStart) {
        hiddenRanges.push({
          range: new vscode.Range(
            new vscode.Position(m.lineNumber, m.columnStart),
            new vscode.Position(m.lineNumber, m.selectionStartColumn)
          ),
        });
      }
      if (m.fullEnd > m.selectionEndColumn) {
        hiddenRanges.push({
          range: new vscode.Range(
            new vscode.Position(m.lineNumber, m.selectionEndColumn),
            new vscode.Position(m.lineNumber, m.fullEnd)
          ),
        });
      }
    }
  }

  // Handle markdown backlink links
  const backlinkLinkMatches = scanMarkdownBacklinkLinkMatches(doc);
  for (const m of backlinkLinkMatches) {
    const wordRange = new vscode.Range(
      new vscode.Position(m.lineNumber, m.selectionStartColumn),
      new vscode.Position(m.lineNumber, m.selectionEndColumn)
    );
    const pos = selection?.active;
    const suppression = getSuppressDecorationOnJump();
    let cursorInside =
      !!pos &&
      pos.line === m.lineNumber &&
      pos.character >= m.columnStart &&
      pos.character <= m.fullEnd;
    if (
      suppression &&
      suppression.uri === doc.uri.toString() &&
      suppression.line === m.lineNumber &&
      suppression.character === pos?.character
    ) {
      cursorInside = false;
    }
    if (cursorInside) {
      linkTextActiveRanges.push({ range: wordRange });
    } else {
      linkTextRanges.push({ range: wordRange });
      if (m.selectionStartColumn > m.columnStart) {
        hiddenRanges.push({
          range: new vscode.Range(
            new vscode.Position(m.lineNumber, m.columnStart),
            new vscode.Position(m.lineNumber, m.selectionStartColumn)
          ),
        });
      }
      if (m.fullEnd > m.selectionEndColumn) {
        hiddenRanges.push({
          range: new vscode.Range(
            new vscode.Position(m.lineNumber, m.selectionEndColumn),
            new vscode.Position(m.lineNumber, m.fullEnd)
          ),
        });
      }
    }
  }

  return {
    anchorTextRanges,
    anchorTextActiveRanges,
    linkTextRanges,
    linkTextActiveRanges,
    hiddenRanges,
    anchorTextDecoration,
    anchorTextActiveDecoration,
    linkTextDecoration,
    linkTextActiveDecoration,
    hiddenDecoration,
  };
}

export function registerMarkdownDecorations(context: vscode.ExtensionContext) {
  const decorateEditor = async (editor?: vscode.TextEditor) => {
    if (!editor) return;
    const doc = editor.document;
    if (!doc.fileName.endsWith(".md")) return;

    if (!anchorIndex.isFileProcessed(doc.uri)) return;

    const selection = editor.selection;
    const {
      anchorTextRanges,
      anchorTextActiveRanges,
      linkTextRanges,
      linkTextActiveRanges,
      hiddenRanges,
      anchorTextDecoration,
      anchorTextActiveDecoration,
      linkTextDecoration,
      linkTextActiveDecoration,
      hiddenDecoration,
    } = buildMarkdownDecorationRanges(doc, selection, context);
    editor.setDecorations(anchorTextDecoration, anchorTextRanges);
    editor.setDecorations(anchorTextActiveDecoration, anchorTextActiveRanges);
    editor.setDecorations(linkTextDecoration, linkTextRanges);
    editor.setDecorations(linkTextActiveDecoration, linkTextActiveRanges);
    editor.setDecorations(hiddenDecoration, hiddenRanges);
  };
  for (const editor of vscode.window.visibleTextEditors) {
    decorateEditor(editor);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((e) => decorateEditor(e)),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const active = vscode.window.activeTextEditor;
      if (active && e.document === active.document) decorateEditor(active);
    }),
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const suppr = getSuppressDecorationOnJump();
      if (suppr) {
        const pos = e.textEditor.selection.active;
        const sameDoc = e.textEditor.document.uri.toString() === suppr.uri;
        const samePos =
          sameDoc &&
          pos.line === suppr.line &&
          pos.character === suppr.character;
        if (!samePos) {
          clearSuppressDecorationOnJump();
        }
      }
      const active = vscode.window.activeTextEditor;
      if (active) decorateEditor(active);
    })
  );
}
