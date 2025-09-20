import * as vscode from 'vscode';
import messages from '../constants/messages';

import { anchorIndex } from './anchorIndex';
import { AnchorTreeItem } from '../tree/AnchorTreeItem';
import { FileTreeItem } from '../tree/FileTreeItem';
import { findAllSupportedFiles } from '../utils/helpers';
import { scanAnchorMatches, scanMarkdownAnchorMatches } from '../utils/helpers';

declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearInterval(handle: any): void;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearTimeout(handle: any): void;

type TreeNode = FileTreeItem | AnchorTreeItem;

export class AnchorsTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
	private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData: vscode.Event<void> = this.onDidChangeTreeDataEmitter.event;

	private cachedAnchorItems: AnchorTreeItem[] = [];
	private roots: FileTreeItem[] = [];
	private isInitialized = false;
	private duplicateNotifier: any;
	private currentDuplicateIds: string[] = [];
	private outputChannel = vscode.window.createOutputChannel('Comment Linking');
	private rebuildTimer: any;

	constructor(private readonly context: vscode.ExtensionContext) { }

	refresh() {
		this.onDidChangeTreeDataEmitter.fire();
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		if (!this.isInitialized) {
			await this.rebuild();
			this.isInitialized = true;
		}
		if (!element) return this.roots;
		if (element instanceof FileTreeItem) {
			const fileAnchors = this.cachedAnchorItems.filter(a => a.fileUri.toString() === element.fileUri.toString());
			return fileAnchors;
		}
		return [];
	}

	async rebuild() {
		if (this.rebuildTimer) {
			clearTimeout(this.rebuildTimer);
		}

		this.rebuildTimer = setTimeout(async () => {
			await this.doRebuild();
		}, 1000);
	}

	private async doRebuild() {
		const time = new Date().toLocaleTimeString('en-US', { hour12: false });
		this.outputChannel.appendLine(`🗂️ Indexing started at ${time}`);
		
		const anchorItems: AnchorTreeItem[] = [];
		const files = await findAllSupportedFiles();

		for (const file of files) {
			try {
				const doc = await vscode.workspace.openTextDocument(file);
				const anchors = this.extractAnchorsFromDocument(doc);
				anchorItems.push(...anchors);
			} catch { }
		}

		this.cachedAnchorItems = anchorItems.sort((a, b) => a.anchorId.localeCompare(b.anchorId));
		const byFile = new Map<string, { uri: vscode.Uri; count: number }>();
		for (const it of this.cachedAnchorItems) {
			const key = it.fileUri.toString();
			const prev = byFile.get(key) ?? { uri: it.fileUri, count: 0 };
			prev.count += 1;
			byFile.set(key, prev);
		}
		this.roots = Array.from(byFile.values())
			.map(v => new FileTreeItem(v.uri, v.count))
			.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));

		const counts = new Map<string, number>();
		for (const it of this.cachedAnchorItems) {
			counts.set(it.anchorId, (counts.get(it.anchorId) ?? 0) + 1);
		}
		const duplicates = Array.from(counts.entries())
			.filter(([, n]) => n > 1)
			.map(([id]) => id);
		this.handleDuplicateAnchors(duplicates);
		anchorIndex.set(anchorItems.map(it => ({ anchorId: it.anchorId, uri: it.fileUri, line: it.lineNumber, column: it.columnStart, caretColumn: it.selectionEndColumn, selectionStartColumn: it.selectionStartColumn, selectionEndColumn: it.selectionEndColumn })));
		this.refresh();
	}

	private handleDuplicateAnchors(duplicates: string[]) {
		const had = this.currentDuplicateIds.length > 0;
		const has = duplicates.length > 0;
		this.currentDuplicateIds = duplicates;
		const fireOnce = () => {
			const list = this.currentDuplicateIds.slice(0, 5).join(', ');
			const more = this.currentDuplicateIds.length > 5 ? ` and ${this.currentDuplicateIds.length - 5} more` : '';
			const msg = messages.duplicateAnchorError
				.replace('{list}', list)
				.replace('{more}', more);
			vscode.window.showErrorMessage(msg);
		};
		if (has) {
			fireOnce();
			if (!this.duplicateNotifier) {
				this.duplicateNotifier = setInterval(() => {
					if (this.currentDuplicateIds.length === 0) return;
					fireOnce();
				}, 5000);
				this.context.subscriptions.push({
					dispose: () => {
						if (this.duplicateNotifier) {
							clearInterval(this.duplicateNotifier);
							this.duplicateNotifier = undefined;
						}
					}
				});
			}
		} else if (had && this.duplicateNotifier) {
			clearInterval(this.duplicateNotifier);
			this.duplicateNotifier = undefined;
		}
	}

	private extractAnchorsFromDocument(doc: vscode.TextDocument): AnchorTreeItem[] {
		const results: AnchorTreeItem[] = [];
		const isMd = doc.fileName.endsWith('.md');
		const matches = isMd ? scanMarkdownAnchorMatches(doc) : scanAnchorMatches(doc);
		for (const m of matches) {
			results.push(new AnchorTreeItem(
				m.anchorId,
				doc.uri,
				m.lineNumber,
				m.preview,
				m.columnStart,
				m.selectionStartColumn,
				m.selectionEndColumn
			));
		}
		return results;
	}
}


