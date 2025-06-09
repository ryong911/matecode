# Packaging and Installing MateCode Extension

## Prerequisites

- Node.js and npm installed
- vsce package manager (`npm install -g @vscode/vsce`)

## Common Issues and Solutions

### 1. Missing repository field

If you encounter an error about a missing repository field, ensure your `package.json` contains:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/ryong911/matecode.git"
}
```

### 2. Source code excluded in .vscodeignore

Check your `.vscodeignore` file to ensure the `src/` directory is not excluded. If you see `src/**` in the file, comment it out or remove it.

```
# Exclude development files
.vscode/**
.vscode-test/**
out/**
node_modules/**
# src/**  # Make sure this line is commented out or removed
.gitignore
```

## Packaging Steps

1. Clone the repository:
   ```
   git clone https://github.com/ryong911/matecode.git
   ```

2. Navigate to the project directory:
   ```
   cd matecode
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Package the extension:
   ```
   vsce package
   ```
   This will generate a `.vsix` file in the root directory.

## Installation Methods

### Method 1: Using VS Code GUI

1. Open VS Code
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac)
3. Type "Extensions: Install from VSIX" and press Enter
4. Browse to and select the generated `.vsix` file

### Method 2: Using Command Line

```
code --install-extension matecode-0.1.0.vsix
```

### Method 3: Drag and Drop

Drag the `.vsix` file and drop it onto the VS Code window.

## Troubleshooting

### Error: Cannot find extension.js

Ensure your `package.json` has the correct `main` field pointing to your entry point:

```json
"main": "./src/extension.js",
```

And make sure the `.vscodeignore` file is not excluding your source code.

### Error: Cannot run package command

If you encounter errors with the `vsce` command:

1. Make sure it's installed globally: `npm install -g @vscode/vsce`
2. Try with latest version: `npm uninstall -g vsce && npm install -g @vscode/vsce`

### Missing Publisher

Ensure your `package.json` has a `publisher` field:

```json
"publisher": "your-publisher-name",
```

For personal use/testing, you can use any name as the publisher.