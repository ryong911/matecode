/**
 * demo/test-extension.js
 * 
 * This script demonstrates how to use the Chat-Code Apply extension programmatically
 * for testing or automation purposes. It simulates copying content from a chat
 * response and applying it through the extension.
 */

// Mock VS Code API for testing
const vscode = {
  env: {
    clipboard: {
      readText: async () => {
        // Simulating clipboard content from sample-chat-response.md
        const clipboardContent = `
# Sample LLM Chatbot Response with Code Blocks

Hi there! Here's the implementation of the to-do list application you requested. Let me break it down by files:

## HTML Structure (index.html)

index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Todo List</h1>
        <div class="input-container">
            <input type="text" id="task-input" placeholder="Add a new task...">
            <button id="add-button">Add</button>
        </div>
        <ul id="task-list">
            <!-- Tasks will be added here dynamically -->
        </ul>
    </div>
    <script src="app.js"></script>
</body>
</html>
\`\`\`

## CSS Styling (styles.css)

styles.css
\`\`\`css
/* Abbreviated for the test */
body {
    background-color: #f5f5f5;
}
.container {
    max-width: 600px;
    margin: 40px auto;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
}
\`\`\`

## JavaScript Functionality (app.js)

app.js
\`\`\`javascript
// Abbreviated for the test
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    
    // Add task event
    addButton.addEventListener('click', () => {
        console.log('Task added');
    });
});
\`\`\`
`;
        return clipboardContent;
      }
    }
  },
  window: {
    showInformationMessage: (message) => console.log(`INFO: ${message}`),
    showErrorMessage: (message) => console.error(`ERROR: ${message}`),
    showWarningMessage: (message) => console.warn(`WARNING: ${message}`),
    createQuickPick: () => ({
      placeholder: '',
      items: [],
      show: () => {},
      onDidAccept: (callback) => { callback(); },
      dispose: () => {}
    }),
    showTextDocument: (doc) => {
      console.log(`Showing document: ${doc.fileName}`);
      return Promise.resolve();
    },
    setStatusBarMessage: (message, timeout) => {
      console.log(`Status bar: ${message}`);
      if (timeout) {
        setTimeout(() => {
          console.log('Status bar message cleared');
        }, timeout);
      }
      return { dispose: () => {} };
    },
    showSaveDialog: () => Promise.resolve({ fsPath: '/test/path' }),
    showOpenDialog: () => Promise.resolve({ fsPath: ['/test/path'] })
  },
  commands: {
    executeCommand: (command) => console.log(`Executing command: ${command}`)
  },
  workspace: {
    fs: {
      writeFile: (uri, content) => {
        console.log(`Writing file: ${uri.path}`);
        return Promise.resolve();
      },
      stat: (uri) => {
        return Promise.resolve({ type: 1 }); // 1 for file
      },
      createDirectory: (uri) => {
        console.log(`Creating directory: ${uri.path}`);
        return Promise.resolve();
      }
    },
    openTextDocument: (uri) => {
      console.log(`Opening document: ${uri.path}`);
      return Promise.resolve({
        fileName: uri.path,
        getText: () => ''
      });
    }
  },
  Uri: {
    file: (path) => ({ path, scheme: 'file' }),
    parse: (path) => ({ path, scheme: 'file' })
  },

};

// Import the extension functionality
// In a real test, you'd use the actual extension code
const { parseCodeBlocks, applyCodeBlocks } = require('../src/codeBlockParser');

async function simulateExtensionUsage() {
  console.log('----------------------------------------------------');
  console.log('Chat-Code Apply Extension - Test Demonstration');
  console.log('----------------------------------------------------');
  
  console.log('\n1. Reading clipboard content...');
  const clipboardText = await vscode.env.clipboard.readText();
  console.log(`Clipboard content length: ${clipboardText.length} characters`);
  
  console.log('\n2. Parsing code blocks from clipboard...');
  const codeBlocks = parseCodeBlocks(clipboardText);
  
  console.log('\n3. Found code blocks:');
  codeBlocks.forEach((block, index) => {
    console.log(`   [${index + 1}] ${block.filePath} (${block.language}) - ${block.code.length} characters`);
  });
  
  console.log('\n4. Applying code blocks to workspace...');
  await applyCodeBlocks(codeBlocks, vscode);
  
  console.log('\n5. Test demonstration complete!');
  console.log('----------------------------------------------------');
  
  return {
    clipboardText,
    codeBlocks,
    success: codeBlocks.length > 0
  };
}

// Execute the test if run directly
if (require.main === module) {
  simulateExtensionUsage()
    .then(result => {
      console.log(`\nTest Summary: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
      console.log(`Found ${result.codeBlocks.length} code blocks`);
    })
    .catch(error => {
      console.error('Test failed with error:', error);
    });
}

// Export for programmatic testing
module.exports = {
  simulateExtensionUsage
};