import * as vscode from 'vscode';

import { getSuppressDecorationOnJump } from '../utils/helpers';
import { scanAnchorMatches, scanPlainLinkMatches } from '../utils/helpers';

export interface BuiltRanges {
	anchorTextRanges: vscode.DecorationOptions[];
	anchorTextActiveRanges: vscode.DecorationOptions[];
	linkTextRanges: vscode.DecorationOptions[];
	linkTextActiveRanges: vscode.DecorationOptions[];
	hiddenRanges: vscode.DecorationOptions[];
}

export function buildDecorationRanges(doc: vscode.TextDocument, selection: vscode.Selection | undefined): BuiltRanges {
	const anchorTextRanges: vscode.DecorationOptions[] = [];
	const anchorTextActiveRanges: vscode.DecorationOptions[] = [];
	const linkTextRanges: vscode.DecorationOptions[] = [];
	const linkTextActiveRanges: vscode.DecorationOptions[] = [];
	const hiddenRanges: vscode.DecorationOptions[] = [];

	const anchorMatches = scanAnchorMatches(doc);
	for (const m of anchorMatches) {
		const wordRange = new vscode.Range(
			new vscode.Position(m.lineNumber, m.selectionStartColumn),
			new vscode.Position(m.lineNumber, m.selectionEndColumn)
		);
		const pos = selection?.active;
		const suppression = getSuppressDecorationOnJump();

		let cursorInside = !!pos && pos.line === m.lineNumber && pos.character >= m.columnStart && pos.character <= m.fullEnd;

		if (suppression && suppression.uri === doc.uri.toString() && suppression.line === m.lineNumber && suppression.character === pos?.character) {
			cursorInside = false;
		}

		if (cursorInside) {
			anchorTextActiveRanges.push({ range: wordRange });
		} else {
			anchorTextRanges.push({ range: wordRange });
			hiddenRanges.push({ range: new vscode.Range(new vscode.Position(m.lineNumber, m.columnStart), new vscode.Position(m.lineNumber, m.selectionStartColumn)) });
			hiddenRanges.push({ range: new vscode.Range(new vscode.Position(m.lineNumber, m.selectionEndColumn), new vscode.Position(m.lineNumber, m.fullEnd)) });
		}
	}

	const plainLinkMatches = scanPlainLinkMatches(doc);
	for (const m of plainLinkMatches) {
		const wordRange = new vscode.Range(
			new vscode.Position(m.lineNumber, m.selectionStartColumn),
			new vscode.Position(m.lineNumber, m.selectionEndColumn)
		);
		const pos = selection?.active;
		let cursorInside = !!pos && pos.line === m.lineNumber && pos.character >= m.columnStart && pos.character <= m.fullEnd;
		if (cursorInside) {
			linkTextActiveRanges.push({ range: wordRange });
		} else {
			linkTextRanges.push({ range: wordRange });
			hiddenRanges.push({ range: new vscode.Range(new vscode.Position(m.lineNumber, m.columnStart), new vscode.Position(m.lineNumber, m.selectionStartColumn)) });
			hiddenRanges.push({ range: new vscode.Range(new vscode.Position(m.lineNumber, m.selectionEndColumn), new vscode.Position(m.lineNumber, m.fullEnd)) });
		}
	}
	return { anchorTextRanges, anchorTextActiveRanges, linkTextRanges, linkTextActiveRanges, hiddenRanges };
}


