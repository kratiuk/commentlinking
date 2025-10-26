import * as vscode from 'vscode';

import { isSupportedDocument, getDocumentSelectorsForLinks, scanPlainLinkMatches, scanBacklinkLinkMatches, isFileIgnored } from '../utils/helpers';
import { anchorIndex } from '../anchors/anchorIndex';
import messages from '../constants/messages';

export function registerCommentDocumentLinks(context: vscode.ExtensionContext) {
	const provider: vscode.DocumentLinkProvider = {
		async provideDocumentLinks(document: vscode.TextDocument): Promise<vscode.DocumentLink[]> {
			if (!isSupportedDocument(document)) return [];
			
			if (await isFileIgnored(document.uri)) return [];
			
			const links: vscode.DocumentLink[] = [];
			
			// Handle regular links
			const matches = scanPlainLinkMatches(document);
			for (const m of matches) {
				const id = m.anchorId;
				const range = new vscode.Range(
					new vscode.Position(m.lineNumber, m.selectionStartColumn),
					new vscode.Position(m.lineNumber, m.selectionEndColumn)
				);
				const target = anchorIndex.findFirst(id);
				if (target) {
					const commandUri = vscode.Uri.parse(
						`command:commentlinking.openAnchor?${encodeURIComponent(JSON.stringify([id]))}`
					);
					const link = new vscode.DocumentLink(range, commandUri);
					link.tooltip = messages.goToAnchorTooltip.replace('{id}', id);
					links.push(link);
				}
			}

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
						`command:commentlinking.openAnchor?${encodeURIComponent(JSON.stringify([id]))}`
					);
					const link = new vscode.DocumentLink(range, commandUri);
					link.tooltip = messages.goToAnchorTooltip.replace('{id}', id);
					links.push(link);
				}
			}
			
			return links;
		}
	};

	context.subscriptions.push(
		vscode.languages.registerDocumentLinkProvider(getDocumentSelectorsForLinks(), provider)
	);
}


