# MateCode

A VS Code extension for applying code blocks from LLM chatbot responses directly to your workspace files.

## Features

- **Configurable Features (New!)**: Toggle on/off various productivity features:
  - **Diff Preview**: See side-by-side comparison before applying changes
  - **One-click Undo**: Easily revert applied changes with a single command
  - **Auto Formatting/Linting**: Format code automatically after applying changes
  - **Sidebar History View**: Track and restore from previous code applications
- **Smart Partial Updates**: Intelligently detects when an LLM suggests changes to specific functions and applies only those changes without replacing the entire file
- **Apply Copied Code Blocks**: Extract and apply code blocks from your clipboard or selected text to workspace files
- **Apply to Open Files**: Directly apply code blocks to matching open files in your editor
- **Language Support**: Properly handles multiple languages including Python, HTML, JavaScript, and Bash/Shell
- **Configuration Options**: Customize keyboard shortcuts and set a default save location for new files

## Usage

### Apply Copied Code Blocks (Ctrl+Shift+A)

1. Copy text from an LLM chatbot response (or select it in your editor)
2. Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
3. The extension will parse the text, identify code blocks with file paths, and create/update files in your workspace

### Apply to Open Files (Ctrl+Shift+D)

1. Copy text from an LLM chatbot response (or select it in your editor)
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
3. The extension will:
   - Find open editor tabs that match filenames from the code blocks
   - Apply code to matching open files automatically
   - For non-matching files, prompt you to create new files

### Smart Partial Code Updates

When using the Apply to Open Files feature, the extension now intelligently handles partial code updates:

1. If the code block contains only specific function implementations, the extension will:
   - Identify the matching functions in your existing file
   - Replace only those functions, preserving the rest of your file
   - Show a notification indicating a partial update was applied
   
2. This is especially useful when an AI assistant suggests improvements to specific functions without rewriting the entire file

3. The detection is automatic - no additional actions required!

## Code Block Format

For the extension to recognize code blocks, they should be in markdown format with file paths:

```
filename.js
```javascript
console.log('Hello world');
```

Or:

path/to/file.py
```python
print('Hello world')
```

## Configuration

This extension provides several customization options:

1. **Default Save Folder**: Set a default folder where new files will be created
2. **Custom Keybindings**: Change the default keyboard shortcuts

To configure these options:

1. Go to File > Preferences > Settings
2. Search for "Chat-Code Apply"
3. Adjust the settings as needed

## Supported Languages

The extension properly handles code blocks from multiple languages including:
- Python
- HTML
- JavaScript
- Bash/Shell
- And many more

## Requirements

- Visual Studio Code 1.70.0 or higher

## New Features

### Diff Preview

Before applying changes to your code, the extension can show you a side-by-side comparison of the original and modified code:

1. When applying code to an existing file, a diff preview will automatically appear
2. Review the changes carefully to ensure they're correct
3. Click "Apply" to confirm or "Cancel" to reject the changes

### One-click Undo

Worried about applying incorrect changes? One-click Undo provides a safety net:

1. Every time you apply code changes, the extension creates a backup of the original file
2. To revert to the previous version, use the command `MateCode: Revert Last Applied Change` or find it in the command palette
3. You can also view and restore from any historical backup using the History View

### Auto Formatting/Linting

After applying code, the extension can automatically format it to match your project's style:

1. When enabled, the extension will attempt to format the code after applying changes
2. Uses VS Code's built-in formatting capabilities
3. Works with any formatter configured in your VS Code settings (e.g., Prettier, Black, etc.)

### History View

The History View provides a timeline of all code changes applied through the extension:

1. Open the MateCode History view in the Explorer sidebar
2. View a chronological list of all changes with timestamps
3. Click any item to restore that specific version
4. Right-click for additional options

## Extension Settings

This extension contributes the following settings:

* `matecode.defaultSaveFolder`: Default folder path to save new files (relative to workspace root)
* `matecode.applyToOpenFilesKeybinding`: Keybinding for applying code blocks to open files
* `matecode.applyCodeBlocksKeybinding`: Keybinding for applying code blocks to workspace
* `matecode.enableDiffPreview`: Enable or disable the diff preview feature (default: true)
* `matecode.enableOneClickUndo`: Enable or disable the one-click undo feature (default: true)
* `matecode.enableAutoFormat`: Enable or disable automatic code formatting after applying changes (default: false)
* `matecode.enableSidebarHistory`: Enable or disable the history view in the sidebar (default: true)
* `matecode.maxHistoryItems`: Maximum number of history items to store (default: 50)
* `matecode.backupLocation`: Location to store backup files (default: ~/.matecode/backup)
