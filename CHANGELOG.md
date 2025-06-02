# Changelog

All notable changes to the "MateCode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Renamed extension from "Chat-Code Apply" to "MateCode"
- Updated all references and commands to use the new name
- Changed backup location from ~/.chat-code-apply/backup to ~/.matecode/backup

### Added
- Configurable features with On/Off toggles in settings:
  - Diff Preview: Side-by-side comparison before applying changes with Accept/Cancel options
  - One-click Undo: Backup files before changes and restore with a single command
  - Auto Formatter/Linter: Run code formatters automatically after applying code blocks
  - Sidebar History View: Track and restore from the last 50 code applications
- Smart partial code updates - detects and applies changes to specific functions instead of replacing entire files
- New command to apply code blocks directly to open files (Ctrl+Shift+D)
- Configuration options for customizing keyboard shortcuts
- Option to set a default save folder for new files
- Enhanced language detection for Python, HTML, JavaScript, and Bash/Shell
- Initial extension scaffolding
- Core functionality for parsing code blocks from chat responses
- Support for creating new files from code blocks
- Support for updating existing files with code blocks
- File path detection from code block comments or headers
- Command to apply code from current document
- Automatic language detection from code block fences

### Changed
- Improved code block parsing to include language information
- Updated README with new features documentation
- Improved error handling with helpful messages

## [0.1.0] - Initial Release

### Added
- Basic functionality for parsing code blocks from chat responses
- Support for creating new files from code blocks
- Command to apply code from current document