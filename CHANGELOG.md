# 🔥 New Features
- Added full support for `Markdown` files with complete text indexing
```
[<Placeholder>](<><ID>) - link
[<Placeholder>](<>#<ID>) - anchor
```
- Added support for custom file types through settings (GUI or `.json` configuration)

# Indexing
- Optimized file indexing (using debouncing with 1000ms timeout to avoid unnecessary re-indexing)

# Logging
- Added output messages on indexing startup (can be useful for diagnostics)

# Project
- Added extension to `OpenVSX Marketplace`
- Bumped version to 0.2.0
- Added testing instructions for the plugin in `./README.md`