/**
 * Format Tools Module for Chat-Code Apply extension
 * Provides automatic code formatting functionality
 */
const vscode = require('vscode');

/**
 * Formats a document using VS Code's formatting API
 * @param {vscode.TextDocument} document - The document to format
 * @returns {Promise<boolean>} - True if formatting was successful, false otherwise
 */
async function formatDocument(document) {
    // Check if auto-formatting is enabled in configuration
    const config = vscode.workspace.getConfiguration('chatcodeApply');
    const enableAutoFormat = config.get('enableAutoFormat', false);
    
    if (!enableAutoFormat) {
        return false;
    }
    
    try {
        // Get the editor for this document
        const editor = await vscode.window.showTextDocument(document);
        
        // Try to format using document formatting API
        await vscode.commands.executeCommand(
            'editor.action.formatDocument',
            editor.document.uri
        );
        
        // Save the document after formatting
        await document.save();
        
        return true;
    } catch (error) {
        console.error('Error formatting document:', error);
        return false;
    }
}

/**
 * Creates a backup of a document and then formats it
 * @param {vscode.TextDocument} document - The document to backup and format
 * @param {Object} backupManager - The backup manager instance
 * @returns {Promise<boolean>} - True if backup and formatting were successful
 */
async function createBackupForDocument(document, backupManager) {
    if (!backupManager) {
        return false;
    }
    
    try {
        // Create a backup of the current content
        await backupManager.createBackup(document.uri, document.getText());
        
        // Format the document
        return await formatDocument(document);
    } catch (error) {
        console.error('Error creating backup and formatting:', error);
        return false;
    }
}

module.exports = {
    formatDocument,
    createBackupForDocument
};