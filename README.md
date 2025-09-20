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
  <a href="https://github.com/kratiuk/commentlinks/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" />
  </a>
</p>

`🔗 Link between comments in code. Create anchors and jump to them from anywhere`

### 🎬 Examples
- Basic Link ↔ Anchor interaction:

  ![Link-Anchor Demo](./resources/demo/1.gif)

- Anchors view (tree of all anchors):

  ![Anchors View Demo](./resources/demo/2.gif)

### ✅ Supported languages and file formats
- `JavaScript` (.js)
- `TypeScript` (.ts)
- `Python` (.py)
- `JSON` (.json)
- `JSON With Comments` (.jsonc)
- `Markdown` (.md) - full text support with special syntax

### 🧠 How it works
- Add an anchor comment where you want to jump to: `// [MyAnchor](#id)`
- Reference it elsewhere: `// [Go to anchor](id)`
- Click the link to jump to the anchor. The Anchors view shows all anchors across your workspace.

### 📝 Syntax variations
#### In code comments (JS/TS/Python/JSON):
- **Create anchor:** `// [MyAnchor](#myId)`
- **Link to anchor:** `// [Go to anchor](myId)`

#### In Markdown files:
- **Create anchor:** `[MyAnchor](<>#myId)`
- **Link to anchor:** `[Go to anchor](<>myId)`
- **Cross-reference:** Markdown can link to anchors in code comments and vice versa

### ⚙️ Custom File Types
You can extend support to any file type by configuring custom comment syntax in VS Code settings:

**Open Settings** → Search for `commentLinking.customFileTypes` **OR** directly edit your `settings.json` file

```json
{
  "commentLinking.customFileTypes": {
    ".vue": "js",
    ".go": "js", 
    ".sh": "python",
    ... other extensions you want to add support for ...
  }
}
```

**Configuration format:**
- **Key** (e.g. `".vue"`) - File extension to add support for
- **Value** - Comment syntax type to use:
  - `"js"` - Uses `//` comments (like JavaScript/TypeScript)
  - `"python"` - Uses `#` comments (like Python/Shell)

**Here's how it would work for `.go` files:**
```go
// [MyGoAnchor](#goExample) - This works in .go files
// [Link to anchor](goExample)
```

### 📂 Indexing scope & exclusions
- Scans all workspace folders for supported file extensions
- Excludes by default:
  - `node_modules/`
  - any dot-directories (names starting with a dot), e.g. `.git/`, `.vscode/`, `.cache/`

### ✨ Features
- 🔍 Anchors tree view to browse anchors across files
- 🎯 Inline links in comments that jump to anchors
- 🖍️ Smart decorations to highlight only the preview text
- 📋 Copy anchor ID from the Anchors view

### 📦 Installation
1. Install the extension
2. Reload VS Code window (you’ll be prompted on first install)

### 🧪 Development & Testing
To test changes during development:
1. Press `F5` to launch Extension Development Host
2. Make changes to the code and save
3. In the test window, run `Developer: Reload Window` to see updates

### ✅ Roadmap / To‑Do
- [ ] 🧵 Support multiline comments (block and triple-quote styles)
- [ ] 🌐 Add more languages (e.g., `Go`, `Rust`) and support `.jsx/.tsx`

---
Made with 😡 by [Viktor Kratiuk](https://github.com/kratiuk)