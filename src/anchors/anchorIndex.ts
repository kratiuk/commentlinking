import * as vscode from 'vscode';

export type IndexedAnchor = {
	anchorId: string;
	uri: vscode.Uri;
	line: number;
	column: number;
	caretColumn: number;
	selectionStartColumn: number;
	selectionEndColumn: number;
};

class AnchorIndex {
	private nameToLocations: Map<string, IndexedAnchor[]> = new Map();

	public set(anchors: IndexedAnchor[]): void {
		this.nameToLocations.clear();
		for (const a of anchors) {
			const list = this.nameToLocations.get(a.anchorId) ?? [];
			list.push(a);
			this.nameToLocations.set(a.anchorId, list);
		}
	}

	public findFirst(anchorId: string): IndexedAnchor | undefined {
		const list = this.nameToLocations.get(anchorId);
		return list && list.length > 0 ? list[0] : undefined;
	}
}

export const anchorIndex = new AnchorIndex();


