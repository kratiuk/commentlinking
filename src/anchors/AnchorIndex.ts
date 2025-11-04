import * as vscode from "vscode";

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
  private processedFiles: Set<string> = new Set();

  public set(anchors: IndexedAnchor[]): void {
    this.nameToLocations.clear();
    this.processedFiles.clear();

    for (const a of anchors) {
      const list = this.nameToLocations.get(a.anchorId) ?? [];
      list.push(a);
      this.nameToLocations.set(a.anchorId, list);
      this.processedFiles.add(a.uri.toString());
    }
  }

  public setProcessedFiles(files: vscode.Uri[]): void {
    this.processedFiles.clear();
    for (const file of files) {
      this.processedFiles.add(file.toString());
    }
  }

  // Fast check if file was processed during indexing
  public isFileProcessed(uri: vscode.Uri): boolean {
    return this.processedFiles.has(uri.toString());
  }

  public findFirst(anchorId: string): IndexedAnchor | undefined {
    const list = this.nameToLocations.get(anchorId);
    return list && list.length > 0 ? list[0] : undefined;
  }
}

export const anchorIndex = new AnchorIndex();
