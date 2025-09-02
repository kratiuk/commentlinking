import * as vscode from 'vscode';

import { getSuppressDecorationOnJump, clearSuppressDecorationOnJump } from '../utils/helpers';
import { isSupportedDocument } from '../utils/helpers';
import { createDecorationTypes } from './styles';
import { buildDecorationRanges } from './buildRanges';

let _decorateEditorRef: ((editor?: vscode.TextEditor) => void) | null = null;

export function refreshDecorationsNow() {
	const editor = vscode.window.activeTextEditor;
	if (_decorateEditorRef && editor) {
		_decorateEditorRef(editor);
	}
}

export function registerCommentDecorations(context: vscode.ExtensionContext) {

	const { anchorTextDecoration, anchorTextActiveDecoration, linkTextDecoration, linkTextActiveDecoration, hiddenDecoration } = createDecorationTypes(context);

	const decorateEditor = (editor?: vscode.TextEditor) => {
		if (!editor) return;
		const doc = editor.document;
		if (!isSupportedDocument(doc)) return;

		const { anchorTextRanges, anchorTextActiveRanges, linkTextRanges, linkTextActiveRanges, hiddenRanges } = buildDecorationRanges(doc, editor.selection);
		editor.setDecorations(anchorTextDecoration, anchorTextRanges);
		editor.setDecorations(anchorTextActiveDecoration, anchorTextActiveRanges);
		editor.setDecorations(linkTextDecoration, linkTextRanges);
		editor.setDecorations(hiddenDecoration, hiddenRanges);
		editor.setDecorations(linkTextActiveDecoration, linkTextActiveRanges);
	};

	_decorateEditorRef = decorateEditor;

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
				const samePos = sameDoc && pos.line === suppr.line && pos.character === suppr.character;
				if (!samePos) {
					clearSuppressDecorationOnJump();
				}
			}
			const active = vscode.window.activeTextEditor;
			if (active) decorateEditor(active);
		})
	);
}


