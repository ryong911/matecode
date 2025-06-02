const vscode = require('vscode');
const { parseCodeBlocks, applyCodeBlocks, applyCodeBlocksToOpenFiles } = require('./codeBlockParser');
const { BackupManager } = require('./backupManager');
const { HistoryManager } = require('./historyManager');
const { registerHistoryView } = require('./historyView');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('MateCode extension is now active!');
    
    // Initialize managers
    const backupManager = new BackupManager();
    const historyManager = new HistoryManager();
    
    // Initialize backup directory
    backupManager.initialize();
    
    // Register history view
    registerHistoryView(context, historyManager, backupManager);
    
    /**
     * Helper function to get text from clipboard or selection
     */
    async function getTextFromClipboardOrSelection() {
        // Check if there's a text selection
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.selection && !editor.selection.isEmpty) {
            return editor.document.getText(editor.selection);
        } else {
            // If no selection, try to get text from clipboard
            return await vscode.env.clipboard.readText();
        }
    }
    
    // Register command for applying code blocks
    let applyCommand = vscode.commands.registerCommand('matecode.applyCodeBlocks', async function () {
        // Show a status bar message
        vscode.window.setStatusBarMessage('Applying code blocks...', 2000);
        try {
            const text = await getTextFromClipboardOrSelection();
            
            if (!text) {
                vscode.window.showInformationMessage('No code blocks found in clipboard or selection.');
                return;
            }
            
            // Parse the code blocks from the text
            const codeBlocks = parseCodeBlocks(text);
            
            if (codeBlocks.length === 0) {
                vscode.window.showInformationMessage('No valid code blocks found in clipboard or selection.');
                return;
            }
            
            // Apply the code blocks to files
            await applyCodeBlocks(codeBlocks, backupManager, historyManager);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply code blocks: ${error.message}`);
        }
    });
    
    // Register command for applying code blocks to open files
    let applyToOpenFilesCommand = vscode.commands.registerCommand('matecode.applyCodeBlocksToOpenFile', async function () {
        // Show a status bar message
        vscode.window.setStatusBarMessage('Applying code blocks to open files...', 2000);
        try {
            const text = await getTextFromClipboardOrSelection();
            
            if (!text) {
                vscode.window.showInformationMessage('No code blocks found in clipboard or selection.');
                return;
            }
            
            // Parse the code blocks from the text
            const codeBlocks = parseCodeBlocks(text);
            
            if (codeBlocks.length === 0) {
                vscode.window.showInformationMessage('No valid code blocks found in clipboard or selection.');
                return;
            }
            
            // Apply the code blocks to open files
            await applyCodeBlocksToOpenFiles(codeBlocks, backupManager, historyManager);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply code blocks to open files: ${error.message}`);
        }
    });
    
    // Register command for reverting the last applied change
    let revertCommand = vscode.commands.registerCommand('matecode.revertLastApply', async function () {
        try {
            // Check configuration
            const config = vscode.workspace.getConfiguration('matecode');
            if (!config.get('enableOneClickUndo', true)) {
                vscode.window.showInformationMessage('One-click undo feature is disabled in settings.');
                return;
            }
            
            await backupManager.revertLastApply();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to revert last change: ${error.message}`);
        }
    });
    
    // Register command for clearing history
    let clearHistoryCommand = vscode.commands.registerCommand('matecode.clearHistory', async function () {
        try {
            const answer = await vscode.window.showWarningMessage(
                'Are you sure you want to clear all history?',
                'Yes', 'No'
            );
            
            if (answer !== 'Yes') {
                return;
            }
            
            await historyManager.clearHistory();
            vscode.window.showInformationMessage('History cleared successfully.');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear history: ${error.message}`);
        }
    });
    
    // Register command for refreshing history view
    let refreshHistoryCommand = vscode.commands.registerCommand('matecode.refreshHistory', function () {
        try {
            historyManager.loadHistory();
            vscode.window.showInformationMessage('History refreshed.');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh history: ${error.message}`);
        }
    });
    
    // Register commands
    context.subscriptions.push(
        applyCommand,
        applyToOpenFilesCommand,
        revertCommand,
        clearHistoryCommand,
        refreshHistoryCommand
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};