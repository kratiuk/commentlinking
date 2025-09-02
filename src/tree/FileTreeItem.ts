import * as vscode from 'vscode';

export class FileTreeItem extends vscode.TreeItem {
	public readonly fileUri: vscode.Uri;

	constructor(fileUri: vscode.Uri, anchorsCount: number) {
		super(vscode.workspace.asRelativePath(fileUri), vscode.TreeItemCollapsibleState.Collapsed);
		this.fileUri = fileUri;
		this.description = String(anchorsCount);
		this.resourceUri = fileUri;
		this.iconPath = vscode.ThemeIcon.File;
		this.command = {
			command: 'vscode.open',
			title: 'Open File',
			arguments: [fileUri]
		};
	}
}


