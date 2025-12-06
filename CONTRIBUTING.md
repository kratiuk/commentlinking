<h1 align="center">🤝 Contributing</h1>

<p align="center">👋 Pull requests and issues are welcome</p>

<h3 align="center">🛠️ Development</h3>

> ⚠️ This requires `Node.js` and `pnpm` installed on your machine

- Clone the repository:

  ```bash
  git clone https://github.com/kratiuk/commentlinking.git
  cd commentlinking
  ```

- Install dependencies:

  ```bash
  pnpm install
  ```

- Open the directory in VS Code:

  ```bash
  code .
  ```

- Make changes to the code and save

- Press `F5` to launch Extension Development Host. A new VS Code window will open with a sandbox environment running the extension from your current code

- To make further changes, edit the code and save

- To load the latest changes into the extension, open command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) in Extension Development Host and run `Developer: Reload Window`

---

<h3 align="center">📦 Submitting Changes</h3>

---

<h4 align="center">✍️ Commits</h4>

- Use Conventional Commits format:

  ```
  type(scope): description
  ```

- Always update `CHANGELOG.md` with your changes before committing

---

<h4 align="center">🚀 Release</h4>

- To create a release, push a version tag without `v` prefix (this prevents an infinite loop in CI, and ensures the final `v`-prefixed tag is created by the bot, so the release belongs to the bot):

  ```bash
  # Update version in package.json, then:
  git add -A
  git commit -m "chore(release): X.X.X"
  git push origin master

  # Create and push the tag
  git tag X.X.X
  git push origin X.X.X
  ```

- The CI/CD pipeline will automatically:
  - Transform the tag (`X.X.X` → `vX.X.X`)
  - Build the extension
  - Create a GitHub Release
  - Publish to VS Code Marketplace
  - Publish to OpenVSX

---
