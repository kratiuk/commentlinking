import * as vscode from "vscode";

import { anchorIndex } from "./anchors/anchorIndex";
import { AnchorsTreeDataProvider } from "./anchors/AnchorsTreeDataProvider";
import { AnchorTreeItem } from "./tree/AnchorTreeItem";
import { isSupportedDocument, getSupportedGlobPatterns } from "./utils/helpers";
import {
  registerCommentDecorations,
  refreshDecorationsNow,
} from "./decorations/commentDecorator";
import { registerMarkdownDecorations } from "./decorations/markdownDecorator";
import { registerCommentDocumentLinks } from "./links/commentLinkingProvider";
import { setSuppressDecorationOnJump } from "./utils/helpers";
import { registerMarkdownDocumentLinks } from "./links/markdownLinksProvider";

import messages from "./constants/messages";

export function activate(context: vscode.ExtensionContext) {
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

  // Helper function to rebuild and refresh document links
  const rebuildAndRefreshLinks = async () => {
    await provider.rebuild();
    // Re-register link providers to force VS Code to clear cache
    registerLinkProviders();
  };

  const kickoff = async () => {
    // Ignore all errors to prevent extension from failing
    try {
      await rebuildAndRefreshLinks();
    } catch {}
  };

  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    kickoff();
  } else {
    const sub = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      kickoff();
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
      await rebuildAndRefreshLinks();
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
      w.onDidCreate(() => rebuildAndRefreshLinks()),
      w.onDidDelete(() => rebuildAndRefreshLinks()),
      w.onDidChange(() => rebuildAndRefreshLinks())
    );
  }

  // Rebuild when .commentlinkingignore changes
  context.subscriptions.push(
    ignoreWatcher.onDidCreate(() => rebuildAndRefreshLinks()),
    ignoreWatcher.onDidDelete(() => rebuildAndRefreshLinks()),
    ignoreWatcher.onDidChange(() => rebuildAndRefreshLinks())
  );

  // Rebuild when .gitignore changes (if gitignore support is enabled)
  context.subscriptions.push(
    gitignoreWatcher.onDidCreate(() => rebuildAndRefreshLinks()),
    gitignoreWatcher.onDidDelete(() => rebuildAndRefreshLinks()),
    gitignoreWatcher.onDidChange(() => rebuildAndRefreshLinks())
  );

  registerCommentDecorations(context);
  registerMarkdownDecorations(context);

  // Register initial providers
  registerLinkProviders();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("commentLinking.customFileTypes") ||
        e.affectsConfiguration("commentLinking.enableLegacySyntax") ||
        e.affectsConfiguration("commentLinking.useGitignore")
      ) {
        rebuildAndRefreshLinks();
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
}
