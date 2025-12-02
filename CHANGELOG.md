## ⚠️ Breaking Changes

- Removed legacy syntax support
- Removed `commentLinking.enableLegacySyntax` setting

## 🚀 CI/CD

- Consolidated 3 separate workflow files into single `release.yml`
- Changed release trigger from branch push to version tags (e.g., `0.6.0` without `v` prefix)

## 💻 Scripts

- Removed Cyrillic check script as it's no longer needed for the project

## 📖 Documentation

- Updated `README` badges to use flat style and added caching to reduce rate limiting
- Centered all section headings and the tagline quote
- Added horizontal lines between all sections for better readability
- Moved **Features** section right after **Examples**
- Added horizontal line after the tagline quote

## 🐛 Fixes

- Fixed blue underlines appearing between badges by removing whitespace in anchor tags
