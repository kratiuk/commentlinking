import * as vscode from 'vscode';

export class AnchorTreeItem extends vscode.TreeItem {
	public readonly anchorId: string;
	public readonly fileUri: vscode.Uri;
	public readonly lineNumber: number;
	public readonly columnStart: number;
	public readonly selectionStartColumn: number;
	public readonly selectionEndColumn: number;

	constructor(anchorId: string, fileUri: vscode.Uri, lineNumber: number, preview: string, columnStart: number, selectionStartColumn: number, selectionEndColumn: number) {
		super(anchorId, vscode.TreeItemCollapsibleState.None);
		this.anchorId = anchorId;
		this.fileUri = fileUri;
		this.lineNumber = lineNumber;
		this.columnStart = columnStart;
		this.selectionStartColumn = selectionStartColumn;
		this.selectionEndColumn = selectionEndColumn;
		this.description = `${vscode.workspace.asRelativePath(fileUri)}:${lineNumber + 1}`;
		this.tooltip = `${this.description}\n${preview}`;
		this.command = {
			command: 'vscode.open',
			title: 'Open Anchor',
			arguments: [fileUri, { preview: true, selection: new vscode.Range(lineNumber, selectionStartColumn, lineNumber, selectionEndColumn) }]
		};
		this.iconPath = new vscode.ThemeIcon('bookmark');
		this.contextValue = 'anchor';
	}
}


