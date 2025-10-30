# New Features

- Now file and directory exclusion from indexing also works through `.gitignore` (can be disabled: `"commentLinking.useGitignore": false`)

# File Ignoring

- Replaced inefficient per-file ignore checking with batch processing during workspace indexing. The extension now reads ignore patterns once during initialization and maintains a processed files registry, eliminating redundant I/O operations and improving scan performance significantly.

# Project

- Added and completed ROADMAP item: "Add support for using `.gitignore` file as default exclusion file"
- Added husky dependency for pre-commit hooks
- Added special pre-commit hook to check if **CHANGELOG.md** contains Cyrillic characters (since developer writes CHANGELOG as quickly as possible in native language and this could sometimes accidentally end up in push due to oversight)
