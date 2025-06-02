# Contributing to Chat-Code Apply

Thank you for considering contributing to Chat-Code Apply! This extension helps developers apply code blocks from AI chatbots directly to their VS Code workspace. Here's how you can help improve it.

## Development Setup

1. Fork and clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/vscode-chat-code-apply.git
   cd vscode-chat-code-apply
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Launch the extension in debug mode
   - Open the project in VS Code
   - Press F5 to start debugging

## Development Workflow

### Architecture

The extension consists of these key components:

- `extension.js`: Entry point that registers commands and handles activation
- `codeBlockParser.js`: Core logic for parsing code blocks from text and applying them

### Running Tests

```bash
npm test
```

Tests are located in the `test/suite` directory. When adding new features, please include corresponding tests in this folder.

## Feature Ideas

Here are some enhancements you might consider implementing:

1. **Improved Language Detection**
   - Better heuristics for detecting language from code block fences
   - Add more language mappings for common abbreviations

2. **Custom File Path Formats**
   - Allow users to configure different formats for file path detection
   - Support for more complex path specifications

3. **History/Undo Feature**
   - Keep track of previous code applications
   - Allow reverting applied code blocks

4. **Code Block Preview**
   - Show preview of code blocks before applying them
   - Highlighted diff for existing files that would be modified

5. **User Settings**
   - Allow customization of key bindings
   - Configure auto-open behavior for created files

6. **Integration with AI Extensions**
   - Direct integration with ChatGPT, Copilot, or other AI extensions
   - Context awareness for AI conversations

## Pull Request Process

1. Create a new branch for your feature or bugfix
   

2. Make your changes and ensure tests pass
   

3. Update documentation as necessary:
   - Update README.md if you're adding new features
   - Update comments in the code

4. Submit a pull request with a clear description:
   - What issue does it solve?
   - How did you implement the solution?
   - How can it be tested?

## Code Style

- Follow the existing code style (2-space indentation)
- Use meaningful variable and function names
- Add JSDoc comments for functions

## Reporting Bugs

Please report bugs by opening issues on GitHub with:
- A clear description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots if applicable
- Your VS Code version and OS

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Communication

For questions or discussion, please:
- Open an issue on GitHub
- Comment on existing issues related to your question

Thank you for your contributions!