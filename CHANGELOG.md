# 📝 Changelog

All notable changes to this project will be documented in this file

## Unreleased

### 📚 Docs

- Added full changelog history from all versions into this file
- Added mention of `CONTRIBUTING.md` in README so users can find the guidelines
- Added roadmap items for lazy indexing and caching

## v1.0.3 (2026-01-10)

### 🐛 Fixes

- Fixed incorrect syntax name: "Command Linking Ignore" -> "Comment Linking Ignore"

### 📚 Docs

- Updated README badges to use the self-hosted API endpoints to avoid upstream rate limits

### 🧰 Scripts

- Updated count script to use updated cloc paths/exclusions and a dedicated script file

### 🧹 Refactor

- Updated import alias format from `@/` to `@`
- Added lint import grouping rules for domain-based ordering

## v1.0.2 (2026-01-06)

### 🐛 Fixes

- Fixed extension overriding default highlighting for ignore files
- Included custom syntax folder for .commentlinkingignore in VS Code packaging

## v1.0.1 (2026-01-06)

🪲 Bug found: the extension overrides highlighting for all ignore files; the custom highlighting for .commentlinkingignore itself is unavailable because the syntaxes folder was not included in the bundle

### ✨ Features

- Added custom icon for .commentlinkingignore
- Added custom ignore-style syntax for .commentlinkingignore

### 👨‍💻 Developer

- Added pre-commit hook for linting
- Added build with ESBuild
- Added linting with ESLint

## v1.0.0 (2025-12-09)

### ✨ Features

- Added Markdown Preview with Comment Linking support (anchors and links navigation)
- Added local ignore file support (.git/.commentlinkingignore), not tracked by git, highest priority

### ⚠️ Breaking Changes

- Removed legacy syntax support and commentLinking.enableLegacySyntax setting
- Removed custom file types support and commentLinking.customFileTypes setting

### 🐛 Fixes

- Fixed ignore patterns not clearing after deleting .commentlinkingignore file (stale cache issue)
- Fixed blue underlines appearing between badges by removing whitespace in anchor tags

### 🚀 CI/CD

- Consolidated 3 separate workflow files into single release.yml
- Changed release trigger from branch push to version tags (e.g., 0.6.0 without v prefix)

### 💻 Scripts

- Removed all scripts and Husky git hooks as they're not needed currently

### 📖 Documentation

- Created CONTRIBUTING.md with development instructions and release process
- Updated README Installation section with manual build (Snapshot Build) instructions
- Updated README badges to use flat style and added caching to reduce rate limiting
- Centered all section headings and the tagline quote
- Added horizontal lines between all sections for better readability
- Moved Features section right after Examples
- Added horizontal line after the tagline quote

## v0.5.7 (2025-11-22)

### ✨ Features

- Added support for JavaScript and CSS comments in HTML files

## v0.5.6 (2025-11-13)

### ✨ Features

- Added support for Dart (.dart) files
- Added support for Clojure (.clj, .cljs, .cljc) files

### 🎒 Project

- Removed outdated Dart custom file types example from README (Dart is now natively supported)

## v0.5.5 (2025-11-12)

### ✨ Features

- Added support for HTML (.html, .htm) files
- Added support for Ruby (.rb) files
- Added support for CSS (.css, .scss, .sass, .less) files
- Added support for TOML (.toml) files
- Added support for Vue (.vue) files
- Added support for Svelte (.svelte) files
- Added support for XML (.xml) files
- Added support for Makefile (Makefile, makefile, .mk) files
- Added support for Dockerfile (Dockerfile, dockerfile, Dockerfile.*) files
- Added support for PowerShell (.ps1, .psm1, .psd1) files

### 🎒 Project

- Removed outdated Shell custom file types example from README (Shell/Vue are now natively supported)

## v0.5.4 (2025-11-11)

🚀📝 Release Changelog
### ✨ Features

- Added support for Java (.java)
- Added support for Kotlin (.kt, .kts)
- Added support for Swift (.swift)
- Added support for PHP (.php)
- Added support for Shell scripts (.sh, .bash, .zsh)
- Added support for YAML (.yaml, .yml)

## v0.5.3 (2025-11-08)

### 🐛 Bug Fixes

- (#4) Fixed bug where .gitignore/.commentlinkingignore patterns with leading slash (/test) or trailing slash (test/) were not properly ignored, causing some folders to be unexpectedly scanned

## v0.5.2 (2025-11-06)

### 🐛 Bug Fixes

- Fixed anchors not being detected in JSX/TSX comment syntax {/* */}
- Fixed syntax error in count script (removed extra comma)

### 📦 Dependencies

- Updated @types/vscode and engines.vscode to ^1.80.0 for better compatibility
- Updated TypeScript to ^5.9.3

### 📚 Documentation

- Clarified Markdown legacy syntax requirements in README

## v0.5.1 (2025-11-04)

### 🚨 Critical Bug Fix

- Fixed major indexing performance issue: Previously, the extension was scanning ALL files in the workspace (including node_modules, .git, etc.) and then filtering them using ignore patterns. This caused severe delays and high resource usage. Now ignore patterns are applied during file search, dramatically reducing indexing time from 20+ seconds to milliseconds

- Apologies: I sincerely apologize to users who experienced slow VS Code performance, freezing, or delays due to this inefficient indexing behavior

### 🐛 Other Fixes

- Added error handling for initial indexing with user-friendly error messages
- Removed forced link providers re-registration

### 🔧 Code Improvements

- Refactored rebuild methods for better code organization and maintainability
- Added detailed indexing logs with timing information (available in "Comment Linking" output channel)

### ⚡ Performance Improvements

- Increased indexing debounce from 1000ms to 2000ms for better performance

## v0.5.0 (2025-11-02)

⚠️ This version is not recommended for installation because it has an indexing issue. It can cause VS Code to freeze
### ✨ Features

- Added support for TypeScript React (.tsx) and JavaScript React (.jsx) files
- Added support for multiple comment types in JS/TS files: //, /* */, and /** */ (for JSDoc)
- Added support for Rust (.rs) files with // and /* */ comment syntax
- Added support for Go (.go) files with // and /* */ comment syntax
- Added support for C (.c) files with // and /* */ comment syntax
- Added support for C++ (.cpp, .cxx, .cc, .hpp, .h) files with // and /* */ comment syntax
- Added support for C# (.cs) files with // and /* */ comment syntax
- Added support for Python multi-line docstrings: """ and ''' (triple quotes)

### 🐛 Bug Fixes

- Fixed document links not working on VS Code startup without reopening files

### 👝 Project

- Added automated release workflows: GitHub Releases, VS Code Marketplace, OpenVSX
- Updated README.md with current project information

## v0.4.4 (2025-11-01)

### Project

- Added version sync validation commit-msg hook

## v0.4.3 (2025-10-31)

### Project

- Added new roadmap item: "Add and host comprehensive documentation"
- Optimized extension package size by excluding unnecessary files from .vsix

## v0.4.2 (2025-10-30)

### Documentation

- Added clarification that links must be clicked while holding Ctrl/Cmd keys

## v0.4.1 (2025-10-30)

### Fixes

- Removed logic from Markdown link builder that filters out files from index without anchors (this caused some Markdown files to not create links if their content had no anchors)

### Project

- Added unnecessary directories to index ignore
- Added scripts directory to code count

## v0.4.0 (2025-10-30)

### New Features

- Now file and directory exclusion from indexing also works through .gitignore (can be disabled: "commentLinking.useGitignore": false) #3

### File Ignoring

- Replaced inefficient per-file ignore checking with batch processing during workspace indexing. The extension now reads ignore patterns once during initialization and maintains a processed files registry, eliminating redundant I/O operations and improving scan performance significantly

### Project

- Added and completed ROADMAP item: "Add support for using .gitignore file as default exclusion file"
- Added husky dependency for pre-commit hooks
- Added special pre-commit hook to check if CHANGELOG.md contains Cyrillic characters (since developer writes CHANGELOG as quickly as possible in native language and this could sometimes accidentally end up in push due to oversight) @

## v0.3.1 (2025-10-28)

### Project

- Legacy syntax example in README replaced from text to image, as it caused display conflicts on extension marketplaces
- Added item to ROADMAP
- Bump to 0.3.1

## v0.3.0 (2025-10-26)

### New Features

- Added new syntax for anchors and links: [[AnchorID|Anchor]], [[#AnchorID|Link]]
- Added support for .commentlinkingignore file to exclude files from indexing

### Project

- Removed all mentions of Comment Links since the project is called Comment Linking
- Added .wakatime-project file to ignore if someone develops with this plugin in private mode
- Added instructions for building .vsix in README.md
- Bumped version to v0.3.0

## v0.2.2 (2025-09-20)

### Project

- Fixed repository link in package.json metadata
- Bumped version to v0.2.2

## v0.2.1 (2025-09-20)

### Project

- Improved README badges organization (separated VS Marketplace and OpenVSX sections)
- Bumped version to v0.2.1

## v0.2.0 (2025-09-20)

🔥 New Features

- Added full support for Markdown files with complete text indexing
[<Placeholder>](<><ID>) - link
[<Placeholder>](<>#<ID>) - anchor

- Added support for custom file types through settings (GUI or .json configuration)

### Indexing

- Optimized file indexing (using debouncing with 1000ms timeout to avoid unnecessary re-indexing)

### Logging

- Added output messages on indexing startup (can be useful for diagnostics)

### Project

- Added extension to OpenVSX Marketplace
- Bumped version to 0.2.0
- Added testing instructions for the plugin in ./README.md

## v0.1.1 (2025-09-06)

feat(core): add .json/.jsonc support; exclude dot-directories; update…

## v0.1.0 (2025-09-02)

feat: initial MVP of Comment Linking extension
