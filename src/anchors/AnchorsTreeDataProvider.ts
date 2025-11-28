import * as vscode from "vscode";

import { anchorIndex } from "./AnchorIndex";
import messages from "../constants/messages";
import { AnchorTreeItem } from "../tree/AnchorTreeItem";
import { FileTreeItem } from "../tree/FileTreeItem";
import {
  findAllSupportedFiles,
  scanUniversalBacklinkAnchorMatches,
} from "../utils/helpers";

import { TreeNode } from "../constants/types";
import "../constants/types"; // Global timer function declarations

export class AnchorsTreeDataProvider
  implements vscode.TreeDataProvider<TreeNode>
{
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this.onDidChangeTreeDataEmitter.event;

  // Main data storage
  private cachedAnchorItems: AnchorTreeItem[] = [];
  private roots: FileTreeItem[] = [];

  // State tracking
  private isInitialized = false;
  private currentDuplicateIds: string[] = [];

  // Timers and utilities
  private rebuildTimer: any;
  private duplicateNotifier: any;
  private outputChannel = vscode.window.createOutputChannel("Comment Linking");

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Main indexing trigger with debouncing logic
   *
   * Controls when extension rebuilds anchor index:
   * - First time: rebuilds immediately
   * - Subsequent calls: delays 2000ms, canceling previous timers
   */
  async debouncedRebuild() {
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
    }
    // If not initialized yet, rebuild immediately
    if (!this.isInitialized) {
      await this.rebuild();
      return;
    }
    // Otherwise use debounced rebuild
    this.rebuildTimer = setTimeout(async () => {
      // rebuild() does the real indexing work
      await this.rebuild();
    }, 2000);
  }

  /**
   * Actual indexing work - scans all files and rebuilds anchor index
   * This is the heavy operation that handles duplicate detection and UI updates
   */
  private async rebuild() {
    // Start timing the indexing process
    const startTime = Date.now();

    // Log indexing start time
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    this.outputChannel.appendLine(
      messages.indexingStarted.replace("{time}", time)
    );

    const anchorItems: AnchorTreeItem[] = [];

    // Mass file ignoring during indexing happens here
    const files = await findAllSupportedFiles();

    // Log filtered files count (after gitignore and commentlinkingignore filtering)
    this.outputChannel.appendLine(""); // Empty line before
    this.outputChannel.appendLine(
      messages.foundFilesToScan.replace("{count}", files.length.toString())
    );
    files.forEach((file) => {
      this.outputChannel.appendLine(
        `  - ${vscode.workspace.asRelativePath(file)}`
      );
    });
    this.outputChannel.appendLine(""); // Empty line after

    // Process each file: open, extract anchors, collect results
    for (const file of files) {
      try {
        // Log start of processing
        this.outputChannel.append(
          messages.processingFile.replace(
            "{file}",
            vscode.workspace.asRelativePath(file)
          )
        );

        const doc = await vscode.workspace.openTextDocument(file);
        // Extract anchors from each document
        const anchors = this.extractAnchorsFromDocument(doc);
        anchorItems.push(...anchors);

        // Append result to the same line
        this.outputChannel.appendLine(
          messages.foundAnchorsInFile.replace(
            "{count}",
            anchors.length.toString()
          )
        );
      } catch {}
    }

    this.cachedAnchorItems = anchorItems.sort((a, b) =>
      a.anchorId.localeCompare(b.anchorId)
    );

    const byFile = new Map<string, { uri: vscode.Uri; count: number }>();

    for (const it of this.cachedAnchorItems) {
      const key = it.fileUri.toString();
      const prev = byFile.get(key) ?? { uri: it.fileUri, count: 0 };
      prev.count += 1;
      byFile.set(key, prev);
    }

    this.roots = Array.from(byFile.values())
      .map((v) => new FileTreeItem(v.uri, v.count))
      .sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));

    const counts = new Map<string, number>();
    for (const it of this.cachedAnchorItems) {
      counts.set(it.anchorId, (counts.get(it.anchorId) ?? 0) + 1);
    }

    const duplicates = Array.from(counts.entries())
      .filter(([, n]) => n > 1)
      .map(([id]) => id);

    this.handleDuplicateAnchors(duplicates);
    anchorIndex.set(
      anchorItems.map((it) => ({
        anchorId: it.anchorId,
        uri: it.fileUri,
        line: it.lineNumber,
        column: it.columnStart,
        caretColumn: it.selectionEndColumn,
        selectionStartColumn: it.selectionStartColumn,
        selectionEndColumn: it.selectionEndColumn,
      }))
    );

    // Set processed files AFTER set() to include all scanned files, not just those with anchors
    anchorIndex.setProcessedFiles(files);
    this.refresh();

    // Mark as initialized for debouncing logic
    this.isInitialized = true;

    // Log completion time
    const endTime = Date.now();
    const duration = endTime - startTime;
    this.outputChannel.appendLine(""); // Empty line before completion message
    this.outputChannel.appendLine(
      messages.indexingCompleted.replace("{duration}", duration.toString())
    );
    this.outputChannel.appendLine(""); // Empty line after completion message
  }

  /**
   * Extracts anchor objects from a single document.
   * Handles both regular files (anchors in comments) and markdown files (anchors in text).
   */
  private extractAnchorsFromDocument(
    doc: vscode.TextDocument
  ): AnchorTreeItem[] {
    const results: AnchorTreeItem[] = [];

    const backlinkMatches = scanUniversalBacklinkAnchorMatches(doc);
    for (const m of backlinkMatches) {
      results.push(
        new AnchorTreeItem(
          m.anchorId,
          doc.uri,
          m.lineNumber,
          m.preview,
          m.columnStart,
          m.selectionStartColumn,
          m.selectionEndColumn
        )
      );
    }

    return results;
  }

  refresh() {
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!this.isInitialized) {
      await this.debouncedRebuild();
      this.isInitialized = true;
    }
    if (!element) return this.roots;
    if (element instanceof FileTreeItem) {
      const fileAnchors = this.cachedAnchorItems.filter(
        (a) => a.fileUri.toString() === element.fileUri.toString()
      );
      return fileAnchors;
    }
    return [];
  }

  private handleDuplicateAnchors(duplicates: string[]) {
    const had = this.currentDuplicateIds.length > 0;
    const has = duplicates.length > 0;
    this.currentDuplicateIds = duplicates;
    const fireOnce = () => {
      const list = this.currentDuplicateIds.slice(0, 5).join(", ");
      const more =
        this.currentDuplicateIds.length > 5
          ? ` and ${this.currentDuplicateIds.length - 5} more`
          : "";
      const msg = messages.duplicateAnchorError
        .replace("{list}", list)
        .replace("{more}", more);
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
          },
        });
      }
    } else if (had && this.duplicateNotifier) {
      clearInterval(this.duplicateNotifier);
      this.duplicateNotifier = undefined;
    }
  }
}
