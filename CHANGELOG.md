## ✨ Features

- Added local ignore file support (`.git/.commentlinkingignore`), not tracked by git, highest priority

## ⚠️ Breaking Changes

- Removed legacy syntax support
- Removed `commentLinking.enableLegacySyntax` setting

## 🚀 CI/CD

- Consolidated 3 separate workflow files into single `release.yml`
- Changed release trigger from branch push to version tags (e.g., `0.6.0` without `v` prefix)

## 💻 Scripts

- Removed all scripts and Husky git hooks as they're not needed currently

## 📖 Documentation

- Created `CONTRIBUTING.md` with development instructions and release process
- Updated `README` Installation section with manual build (Snapshot Build) instructions
- Updated `README` badges to use flat style and added caching to reduce rate limiting
- Centered all section headings and the tagline quote
- Added horizontal lines between all sections for better readability
- Moved **Features** section right after **Examples**
- Added horizontal line after the tagline quote

## 🐛 Fixes

- Fixed blue underlines appearing between badges by removing whitespace in anchor tags
