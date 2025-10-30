import * as vscode from "vscode";
import {
  scanMarkdownAnchorMatches,
  scanMarkdownLinkMatches,
  scanMarkdownBacklinkLinkMatches,
} from "../utils/helpers";
import { anchorIndex } from "../anchors/anchorIndex";

export function registerMarkdownDocumentLinks(
  context: vscode.ExtensionContext
) {
  const provider: vscode.DocumentLinkProvider = {
    async provideDocumentLinks(
      document: vscode.TextDocument
    ): Promise<vscode.DocumentLink[]> {
      if (!document.fileName.endsWith(".md")) return [];

      if (!anchorIndex.isFileProcessed(document.uri)) return [];

      const links: vscode.DocumentLink[] = [];

      const matches = scanMarkdownLinkMatches(document);
      for (const m of matches) {
        const id = m.anchorId;
        const range = new vscode.Range(
          new vscode.Position(m.lineNumber, m.selectionStartColumn),
          new vscode.Position(m.lineNumber, m.selectionEndColumn)
        );
        const target = anchorIndex.findFirst(id);
        if (target) {
          const commandUri = vscode.Uri.parse(
            `command:commentlinking.openAnchor?${encodeURIComponent(
              JSON.stringify([id])
            )}`
          );
          const link = new vscode.DocumentLink(range, commandUri);
          links.push(link);
        }
      }

      const backlinkMatches = scanMarkdownBacklinkLinkMatches(document);
      for (const m of backlinkMatches) {
        const id = m.anchorId;
        const range = new vscode.Range(
          new vscode.Position(m.lineNumber, m.columnStart),
          new vscode.Position(m.lineNumber, m.fullEnd)
        );
        const target = anchorIndex.findFirst(id);
        if (target) {
          const commandUri = vscode.Uri.parse(
            `command:commentlinking.openAnchor?${encodeURIComponent(
              JSON.stringify([id])
            )}`
          );
          const link = new vscode.DocumentLink(range, commandUri);
          links.push(link);
        }
      }

      return links;
    },
  };
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { pattern: "**/*.md" },
      provider
    )
  );
}
