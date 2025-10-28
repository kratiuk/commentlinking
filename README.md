## 💬 Comment Linking extension for VS Code

<p align="center">
  <img src="./resources/demo/logo.png" alt="Logo" width="160"/>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=kratiuk.commentlinking">
    <img alt="VS Marketplace" src="https://img.shields.io/visual-studio-marketplace/v/kratiuk.commentlinking?style=for-the-badge&color=blue&label=VS%20Marketplace" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=kratiuk.commentlinking">
    <img alt="VS Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/kratiuk.commentlinking?style=for-the-badge&color=informational&cacheSeconds=300" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=kratiuk.commentlinking">
    <img alt="VS Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/r/kratiuk.commentlinking?style=for-the-badge&color=yellow&cacheSeconds=300" />
  </a>
</p>

<p align="center">
  <a href="https://open-vsx.org/extension/kratiuk/commentlinking">
    <img alt="Open VSX Registry" src="https://img.shields.io/open-vsx/v/kratiuk/commentlinking?style=for-the-badge&color=purple&label=Open%20VSX%20Registry" />
  </a>
  <a href="https://open-vsx.org/extension/kratiuk/commentlinking">
    <img alt="Open VSX Downloads" src="https://img.shields.io/open-vsx/dt/kratiuk/commentlinking?style=for-the-badge&color=informational" />
  </a>
  <a href="https://open-vsx.org/extension/kratiuk/commentlinking">
    <img alt="Open VSX Rating" src="https://img.shields.io/open-vsx/rating/kratiuk/commentlinking?style=for-the-badge&color=yellow" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/kratiuk/commentlinking/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" />
  </a>
</p>

`🔗 Link between comments in code. Create anchors and jump to them from anywhere`

### 🎬 Examples

#### 🧠 How it works

- Add an anchor comment where you want to jump to: `[[AnchorID|Some anchor]]`
- Reference it elsewhere: `[[#AnchorID|Go to anchor]]`
- Click the link to jump to the anchor. The Anchors view shows all anchors across your workspace.

- Basic Link ↔ Anchor interaction:

  ![Link-Anchor Demo](./resources/demo/new/basic-preview.gif)

- Anchors view (tree of all anchors):

  _Note: This demo shows the legacy anchor syntax_
  ![Anchors View Demo](./resources/demo/old/2.gif)

  <details>
  <summary>Click to see legacy syntax demo<br/>
  (enable <code>commentLinking.enableLegacySyntax</code> in settings)</summary>

  ![Legacy Syntax Demo](./resources/demo/old/1.gif)

  ![Legacy Syntax](./resources/demo/old/old-syntax.png)

  </details>

### ✅ Supported languages and file formats

- `JavaScript` (.js)
- `TypeScript` (.ts)
- `Python` (.py)
- `JSON` (.json)
- `JSON With Comments` (.jsonc)
- `Markdown` (.md) - full text support with special syntax

### ⚙️ Custom File Types

You can extend support to any file type by configuring custom comment syntax in VS Code settings:

**Open Settings** → Search for `commentLinking.customFileTypes` **OR** directly edit your `settings.json` file

```json
{
  "commentLinking.customFileTypes": {
    ".vue": "js",
    ".go": "js",
    ".sh": "python"
    // Other extensions you want to add support for
  }
}
```

**Configuration format:**

- **Key** (e.g. `".vue"`) - File extension to add support for
- **Value** - Comment syntax type to use:
  - `"js"` - Uses `//` comments (like JavaScript/TypeScript)
  - `"python"` - Uses `#` comments (like Python/Shell)

### 📂 Indexing scope & exclusions

- Scans all workspace folders for supported file extensions
- Excludes by default:
  - `node_modules/`
  - any dot-directories (names starting with a dot), e.g. `.git/`, `.vscode/`, `.cache/`
- Create `.commentlinkingignore` file in project root to exclude additional files/directories

### ✨ Features

- 🔍 Anchors tree view to browse anchors across files
- 🎯 Inline links in comments that jump to anchors
- 🖍️ Smart decorations to highlight only the preview text
- 📋 Copy anchor ID from the Anchors view

### 📦 Installation

1. Install the extension
2. Reload `VS Code` window (you’ll be prompted on first install)

### 🧪 Development & Testing

To test changes during development:

1. Press `F5` to launch Extension Development Host
2. Make changes to the code and save
3. In the test window, run `Developer: Reload Window` to see updates

To build and install the extension manually:

1. Install all dependencies: `pnpm install`
2. Build the extension package: `pnpm package`
3. Install the generated `.vsix` file in VS Code: `Extensions > Install from VSIX...`

### ✅ Roadmap / To‑Do

- [ ] 🧵 Support multiline comments (block and triple-quote styles)
- [ ] 📖 Create Markdown preview with link and anchor support
- [ ] 🔗 Add support for creating anchors and links without preview text in backlinks
- [ ] 🔀 Add sorting by line numbers in anchor tree view
- [ ] 🌐 Add more languages (e.g., `Go`, `Rust`) and support `.jsx/.tsx`
- [ ] ⚙️ Add support for custom comment types for specific files
- [ ] 🎨 Add functionality to configure anchor and link styles
- [ ] 🔄 Add functionality to disable new syntax if users want to use only legacy syntax
- [ ] 🏷️ Add button in anchor tree to toggle between displaying anchor IDs and preview text
- [ ] 🔍 Add support for displaying all links to a specific anchor in the editor

---

Made with 😡 by [Viktor Kratiuk](https://github.com/kratiuk)
