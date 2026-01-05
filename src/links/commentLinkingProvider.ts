import * as vscode from "vscode";

import { anchorIndex } from "@/anchors/AnchorIndex";
import messages from "@/constants/messages";
import {
  getDocumentSelectorsForLinks,
  isSupportedDocument,
  scanBacklinkLinkMatches,
} from "@/utils/helpers";

export function registerCommentDocumentLinks(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const provider: vscode.DocumentLinkProvider = {
    async provideDocumentLinks(
      document: vscode.TextDocument
    ): Promise<vscode.DocumentLink[]> {
      if (!isSupportedDocument(document)) return [];

      const links: vscode.DocumentLink[] = [];

      // Handle backlink links
      const backlinkMatches = scanBacklinkLinkMatches(document);
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
          link.tooltip = messages.goToAnchorTooltip.replace("{id}", id);
          links.push(link);
        }
      }

      return links;
    },
  };

  const disposable = vscode.languages.registerDocumentLinkProvider(
    getDocumentSelectorsForLinks(),
    provider
  );

  context.subscriptions.push(disposable);
  return disposable;
}
