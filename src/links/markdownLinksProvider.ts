import * as vscode from "vscode";
import { anchorIndex } from "@anchors/AnchorIndex";
import { scanMarkdownBacklinkLinkMatches } from "@utils/helpers";

export function registerMarkdownDocumentLinks(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const provider: vscode.DocumentLinkProvider = {
    async provideDocumentLinks(
      document: vscode.TextDocument
    ): Promise<vscode.DocumentLink[]> {
      if (!document.fileName.endsWith(".md")) return [];

      const links: vscode.DocumentLink[] = [];

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

  const disposable = vscode.languages.registerDocumentLinkProvider(
    { pattern: "**/*.md" },
    provider
  );

  context.subscriptions.push(disposable);
  return disposable;
}
