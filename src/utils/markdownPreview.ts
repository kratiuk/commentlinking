import * as vscode from "vscode";

import { anchorIndex } from "../anchors/AnchorIndex";

/**
 * Simple Webview Panel for Markdown Preview with Comment Linking support
 * Features Back/Forward navigation buttons
 */
export class MarkdownPreviewPanel {
  public static currentPanel: MarkdownPreviewPanel | undefined;
  private static readonly viewType = "commentlinking.markdownPreview";

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  // Navigation history
  private history: vscode.Uri[] = [];
  private historyIndex: number = -1;
  private currentUri: vscode.Uri | undefined;

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.context = context;

    this.panel.webview.options = {
      enableScripts: true,
    };

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "openAnchor":
            await this.openAnchor(message.anchorId);
            break;
          case "goBack":
            await this.goBack();
            break;
          case "goForward":
            await this.goForward();
            break;
        }
      },
      null,
      this.disposables
    );

    // Watch for file changes
    const changeListener = vscode.workspace.onDidChangeTextDocument(
      async (e) => {
        if (
          this.currentUri &&
          e.document.uri.toString() === this.currentUri.toString()
        ) {
          await this.updateContent();
        }
      }
    );
    this.disposables.push(changeListener);

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(
    context: vscode.ExtensionContext,
    uri: vscode.Uri
  ) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    // If panel exists, just navigate to the new file
    if (MarkdownPreviewPanel.currentPanel) {
      MarkdownPreviewPanel.currentPanel.panel.reveal(column);
      MarkdownPreviewPanel.currentPanel.navigateTo(uri);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      MarkdownPreviewPanel.viewType,
      "Markdown Preview",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    MarkdownPreviewPanel.currentPanel = new MarkdownPreviewPanel(
      panel,
      context
    );
    MarkdownPreviewPanel.currentPanel.navigateTo(uri);
  }

  private async navigateTo(uri: vscode.Uri, addToHistory: boolean = true) {
    this.currentUri = uri;

    // Update history
    if (addToHistory) {
      // Remove any forward history
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      this.history.push(uri);
      this.historyIndex = this.history.length - 1;
    }

    // Update panel title
    const fileName = uri.path.split("/").pop() || "Preview";
    this.panel.title = `${fileName} — Comment Linking Preview`;

    // Save state for serialization
    this.panel.webview.postMessage({
      command: "setState",
      state: { uri: uri.toString() },
    });

    // Render content
    await this.updateContent();
  }

  private async updateContent() {
    if (!this.currentUri) return;

    try {
      const doc = await vscode.workspace.openTextDocument(this.currentUri);
      const markdown = doc.getText();

      let html = (await vscode.commands.executeCommand(
        "markdown.api.render",
        markdown
      )) as string;

      html = html.replace(
        /\[\[#([^\]|]+)\|([^\]]+)\]\]/g,
        (_match, anchorId, text) => {
          const exists = anchorIndex.findFirst(anchorId) !== undefined;
          const className = exists
            ? "anchor-link"
            : "anchor-link anchor-link-invalid";
          return `<span class="${className}" data-anchor-id="${anchorId}" title="Link to: ${anchorId}">${text}</span>`;
        }
      );

      html = html.replace(
        /\[\[([^\]#|]+)\|([^\]]+)\]\]/g,
        '<span class="anchor" title="Anchor: $1">$2</span>'
      );

      this.panel.webview.html = this.getHtml(html);
    } catch {
      this.panel.webview.html = this.getHtml("<p>Error loading file</p>");
    }
  }

  private async openAnchor(anchorId: string) {
    const anchor = anchorIndex.findFirst(anchorId);

    if (!anchor) {
      vscode.window.showWarningMessage(`Anchor "${anchorId}" not found`);
      return;
    }

    if (anchor.uri.path.endsWith(".md")) {
      // Navigate within preview
      await this.navigateTo(anchor.uri);
    } else {
      // Open non-markdown file in text editor
      const doc = await vscode.workspace.openTextDocument(anchor.uri);
      const editor = await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.One,
        preview: false,
      });

      const position = new vscode.Position(anchor.line, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }

  private async goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      await this.navigateTo(this.history[this.historyIndex], false);
    }
  }

  private async goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      await this.navigateTo(this.history[this.historyIndex], false);
    }
  }

  private getHtml(content: string): string {
    const canGoBack = this.historyIndex > 0;
    const canGoForward = this.historyIndex < this.history.length - 1;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Markdown Preview</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-markdown-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif);
      font-size: var(--vscode-markdown-font-size, 14px);
      line-height: 1.6;
      padding: 0;
      margin: 0;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    
    /* Navigation bar */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      gap: 4px;
      padding: 8px 16px;
      background-color: var(--vscode-editor-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      font-size: 16px;
    }
    .nav-btn:hover:not(:disabled) {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    /* Content */
    .content {
      padding: 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    p { margin-bottom: 16px; }
    code {
      font-family: var(--vscode-editor-font-family, monospace);
      background-color: var(--vscode-textCodeBlock-background);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 85%;
    }
    pre {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
    }
    pre code {
      padding: 0;
      background-color: transparent;
    }
    a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .anchor-link {
      color: #3794ff;
      cursor: pointer;
      text-decoration: underline;
      text-decoration-style: solid;
    }
    .anchor-link:hover {
      text-decoration: underline;
    }
    .anchor-link::after {
      content: ' 🔗';
    }
    .anchor-link-invalid {
      text-decoration: none;
    }
    .anchor {
      color: #4ec9b0;
    }
    .anchor::after {
      content: ' ⚓';
    }
    ul, ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }
    blockquote {
      margin: 0 0 16px 0;
      padding: 0 1em;
      color: var(--vscode-textPreformat-foreground);
      border-left: 4px solid var(--vscode-panel-border);
    }
    table {
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table th, table td {
      padding: 6px 13px;
      border: 1px solid var(--vscode-panel-border);
    }
    table tr:nth-child(even) {
      background-color: var(--vscode-list-hoverBackground);
    }
    img {
      max-width: 100%;
    }
    hr {
      border: none;
      border-top: 1px solid var(--vscode-panel-border);
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="navbar">
    <button class="nav-btn" id="backBtn" title="Go Back" ${
      canGoBack ? "" : "disabled"
    }>←</button>
    <button class="nav-btn" id="forwardBtn" title="Go Forward" ${
      canGoForward ? "" : "disabled"
    }>→</button>
  </div>
  <div class="content">
    ${content}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    // Button clicks
    document.getElementById('backBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'goBack' });
    });
    
    document.getElementById('forwardBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'goForward' });
    });
    
    // Anchor link clicks
    document.querySelectorAll('.anchor-link').forEach(el => {
      el.addEventListener('click', () => {
        const anchorId = el.getAttribute('data-anchor-id');
        vscode.postMessage({ command: 'openAnchor', anchorId });
      });
    });

    // Handle state messages for serialization
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'setState') {
        vscode.setState(message.state);
      }
    });
  </script>
</body>
</html>`;
  }

  public dispose() {
    MarkdownPreviewPanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }

  // For serialization - register this in extension.ts
  public static revive(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    state: { uri: string } | undefined
  ) {
    MarkdownPreviewPanel.currentPanel = new MarkdownPreviewPanel(
      panel,
      context
    );
    if (state?.uri) {
      MarkdownPreviewPanel.currentPanel.navigateTo(vscode.Uri.parse(state.uri));
    }
  }

  // Get current state for serialization
  public getState(): { uri: string } | undefined {
    if (this.currentUri) {
      return { uri: this.currentUri.toString() };
    }
    return undefined;
  }
}
