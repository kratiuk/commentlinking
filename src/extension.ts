import * as vscode from "vscode";

import { anchorIndex } from "@/anchors/AnchorIndex";
import { AnchorsTreeDataProvider } from "@/anchors/AnchorsTreeDataProvider";
import messages from "@/constants/messages";
import {
  refreshDecorationsNow,
  registerCommentDecorations,
} from "@/decorations/commentDecorator";
import { registerMarkdownDecorations } from "@/decorations/markdownDecorator";
import { registerCommentDocumentLinks } from "@/links/commentLinkingProvider";
import { registerMarkdownDocumentLinks } from "@/links/markdownLinksProvider";
import { AnchorTreeItem } from "@/tree/AnchorTreeItem";
import {
  getSupportedGlobPatterns,
  isSupportedDocument,
  setSuppressDecorationOnJump,
} from "@/utils/helpers";
import { kickoff } from "@/utils/initialization";
import { MarkdownPreviewPanel } from "@/utils/markdownPreview";

// Main extension activation function that initializes all components
export function activate(context: vscode.ExtensionContext) {
  // Register webview panel serializer for restoring preview on reload
  vscode.window.registerWebviewPanelSerializer(
    "commentlinking.markdownPreview",
    {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: { uri: string } | undefined
      ) {
        MarkdownPreviewPanel.revive(webviewPanel, context, state);
      },
    }
  );

  // Create and register main indexing provider
  const provider = new AnchorsTreeDataProvider(context);
  vscode.window.registerTreeDataProvider("commentlinking.anchors", provider);

  // Store disposables for link providers so we can re-register them
  let commentLinkDisposable: vscode.Disposable | undefined;
  let markdownLinkDisposable: vscode.Disposable | undefined;

  // Function to register link providers
  const registerLinkProviders = () => {
    // Dispose old providers
    if (commentLinkDisposable) {
      commentLinkDisposable.dispose();
    }
    if (markdownLinkDisposable) {
      markdownLinkDisposable.dispose();
    }

    // Register new providers
    commentLinkDisposable = registerCommentDocumentLinks(context);
    markdownLinkDisposable = registerMarkdownDocumentLinks(context);
  };

  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    // Start initial indexing when workspace is ready
    kickoff(provider);
  } else {
    const sub = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      kickoff(provider);
      sub.dispose();
    });
    context.subscriptions.push(sub);
  }

  const firstRunKey = "commentlinking.installedOnce";
  if (!context.globalState.get(firstRunKey)) {
    context.globalState.update(firstRunKey, true);
    vscode.window
      .showWarningMessage(messages.firstInstallWarning, messages.reloadAction)
      .then(() => {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      });
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (e) => {
      if (!isSupportedDocument(e.document)) return;
      await provider.debouncedRebuild();
    })
  );

  const watcherPatterns = getSupportedGlobPatterns();
  const watchers = watcherPatterns.map((p) =>
    vscode.workspace.createFileSystemWatcher(p)
  );

  const ignoreWatcher = vscode.workspace.createFileSystemWatcher(
    "**/.commentlinkingignore"
  );

  const gitignoreWatcher =
    vscode.workspace.createFileSystemWatcher("**/.gitignore");

  context.subscriptions.push(...watchers, ignoreWatcher, gitignoreWatcher);
  for (const w of watchers) {
    context.subscriptions.push(
      w.onDidCreate(() => provider.debouncedRebuild()),
      w.onDidDelete(() => provider.debouncedRebuild()),
      w.onDidChange(() => provider.debouncedRebuild())
    );
  }

  // Rebuild when .commentlinkingignore changes
  context.subscriptions.push(
    ignoreWatcher.onDidCreate(() => provider.debouncedRebuild()),
    ignoreWatcher.onDidDelete(() => provider.debouncedRebuild()),
    ignoreWatcher.onDidChange(() => provider.debouncedRebuild())
  );

  // Rebuild when .gitignore changes (if gitignore support is enabled)
  context.subscriptions.push(
    gitignoreWatcher.onDidCreate(() => provider.debouncedRebuild()),
    gitignoreWatcher.onDidDelete(() => provider.debouncedRebuild()),
    gitignoreWatcher.onDidChange(() => provider.debouncedRebuild())
  );

  registerCommentDecorations(context);
  registerMarkdownDecorations(context);

  // Register initial providers
  registerLinkProviders();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("commentLinking.useGitignore")) {
        provider.debouncedRebuild();
        refreshDecorationsNow();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "commentlinking.openAnchor",
      async (anchorId: string) => {
        const target = anchorIndex.findFirst(anchorId);
        if (!target) return;
        await vscode.window.showTextDocument(target.uri, {
          selection: new vscode.Range(
            target.line,
            target.selectionStartColumn,
            target.line,
            target.selectionEndColumn
          ),
          preview: true,
        });
        setSuppressDecorationOnJump(
          target.uri,
          target.line,
          target.selectionEndColumn
        );
        refreshDecorationsNow();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "commentlinking.copyAnchorId",
      async (item: AnchorTreeItem) => {
        if (!item) return;
        await vscode.env.clipboard.writeText(item.anchorId);
        vscode.window.setStatusBarMessage(
          messages.anchorCopiedStatus.replace("{id}", item.anchorId),
          2000
        );
      }
    )
  );

  // Register command for opening Markdown Preview
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "commentlinking.openPreview",
      async (uri: vscode.Uri) => {
        if (!uri) {
          // If called from command palette, use active editor
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document.languageId === "markdown") {
            uri = activeEditor.document.uri;
          } else {
            vscode.window.showWarningMessage("No Markdown file selected");
            return;
          }
        }
        // Open Webview Panel
        MarkdownPreviewPanel.createOrShow(context, uri);
      }
    )
  );
}
