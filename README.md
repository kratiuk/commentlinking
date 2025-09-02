## 💬 Comment Linking extension for VS Code

<p align="center">
  <img src="./resources/demo/logo.png" alt="Logo" width="160"/>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=viktorkratiuk.commentlinking">
    <img alt="VS Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/viktorkratiuk.commentlinking?style=for-the-badge&color=blue" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=viktorkratiuk.commentlinking">
    <img alt="VS Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/viktorkratiuk.commentlinking?style=for-the-badge&color=informational" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=viktorkratiuk.commentlinking">
    <img alt="VS Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/r/viktorkratiuk.commentlinking?style=for-the-badge&color=yellow" />
  </a>
  <a href="https://github.com/viktorkratiuk/commentlinks/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" />
  </a>
</p>

`🔗 Link between comments in code. Create anchors and jump to them from anywhere`

### ✅ Supported languages
- `JavaScript` (.js)
- `TypeScript` (.ts)
- `Python` (.py)

### 🧠 How it works
- Add an anchor comment where you want to jump to: `// [MyAnchor](#id)`
- Reference it elsewhere: `// [Go to anchor](id)`
- Click the link to jump to the anchor. The Anchors view shows all anchors across your workspace.

### 🎬 Examples
- Basic Link ↔ Anchor interaction:

  ![Link-Anchor Demo](./resources/demo/1.gif)

- Anchors view (tree of all anchors):

  ![Anchors View Demo](./resources/demo/2.gif)

### ✨ Features
- 🔍 Anchors tree view to browse anchors across files
- 🎯 Inline links in comments that jump to anchors
- 🖍️ Smart decorations to highlight only the preview text
- 📋 Copy anchor ID from the Anchors view

### 📦 Installation
1. Install the extension
2. Reload VS Code window (you’ll be prompted on first install)

### ✅ Roadmap / To‑Do
- [ ] 🧵 Support multiline comments (block and triple-quote styles)
- [ ] 🌐 Add more languages (e.g., `Go`, `Rust`) and support `.jsx/.tsx`

---
Made with 😡 by [Viktor Kratiuk](https://github.com/viktorkratiuk)