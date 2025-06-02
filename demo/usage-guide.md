# Chat-Code Apply Extension - Usage Guide

This guide demonstrates how to use the Chat-Code Apply VS Code extension to quickly apply code blocks from LLM chatbot responses into your workspace files.

## What This Extension Solves

When working with AI coding assistants like ChatGPT, Claude, or GitHub Copilot, you often receive code in multiple blocks that need to be applied to different files. Copying and pasting each block manually is time-consuming and error-prone.

The Chat-Code Apply extension automates this process, allowing you to apply all code blocks at once with a single keyboard shortcut.

## How It Works

**The extension looks for this pattern in copied text:**

```
filepath/filename.ext
```language
code content here
```

The filepath on the line directly above a code block tells the extension where to save the code.

## Step-by-Step Usage Guide

### 1. Get Code from an AI Assistant

Receive a response from your AI coding assistant that includes code blocks with file paths:

![AI Chat Response](images/chat-response-screenshot.png)

### 2. Copy the Response

Select the entire response or the relevant portion containing the code blocks and file paths, then copy it to your clipboard (Ctrl+C or Cmd+C).

### 3. Run the Extension

Trigger the extension using one of these methods:

- Press **Ctrl+Shift+A** (or **Cmd+Shift+A** on Mac)
- Click the "Apply Code Blocks" button in the chatbot view title
- Open command palette (Ctrl+Shift+P) and select "Chat-Code Apply: Apply Copied Code Blocks"

### 4. Confirm File Operations

If the extension needs to create new files or directories, or overwrite existing files, it will prompt you for confirmation:

![Confirmation Dialog](images/confirmation-dialog.png)

### 5. View Applied Code

The extension will create or update the files in your workspace, and open them in the editor:

![Applied Code](images/applied-code-result.png)

## Demonstration

Here's a visual demonstration of the entire process:

1. Copy code from AI chat response
2. Press Ctrl+Shift+A (or Cmd+Shift+A on Mac)
3. See files created and updated automatically

## Example Use Cases

- Quickly implement a multi-file solution suggested by an AI assistant
- Apply refactoring suggestions across multiple files
- Create boilerplate code structures with minimal effort
- Implement design patterns that span multiple files

## Tips for Best Results

- Ensure each code block has a file path directly above it
- For nested directories that don't exist yet, the extension will create them automatically
- You can apply code blocks to both new and existing files
- Work in a version-controlled environment for safety when applying changes to existing files
