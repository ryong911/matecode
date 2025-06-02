/**
 * Diff Preview Module for Chat-Code Apply extension
 * Provides side-by-side diff comparison before applying code changes
 */
const vscode = require('vscode');
const path = require('path');

/**
 * Shows a diff preview before applying code changes
 * @param {string} originalContent - The original file content
 * @param {string} newContent - The new content to be applied
 * @param {string} filePath - The file path
 * @returns {Promise<boolean>} - True if user accepts the changes, false otherwise
 */
async function showDiffPreview(originalContent, newContent, filePath) {
    // Get configuration setting for diff preview
    const config = vscode.workspace.getConfiguration('chatcodeApply');
    const enableDiffPreview = config.get('enableDiffPreview', true);
    
    // If diff preview is disabled, automatically accept changes
    if (!enableDiffPreview) {
        return true;
    }
    
    // Create temporary URIs for the diff editor
    const fileName = path.basename(filePath);
    const originalUri = vscode.Uri.parse(`untitled:${fileName}.original`);
    const newUri = vscode.Uri.parse(`untitled:${fileName}.new`);
    
    try {
        // Create a diff document to show the preview
        const diffTitle = `Changes for ${fileName}`;
        
        // Show the diff view
        await vscode.commands.executeCommand('vscode.diff', 
            originalUri, newUri, 
            diffTitle, 
            { preview: true, viewColumn: vscode.ViewColumn.One });
        
        // Create the documents with content
        await vscode.workspace.openTextDocument(originalUri);
        const originalEdit = new vscode.WorkspaceEdit();
        originalEdit.insert(originalUri, new vscode.Position(0, 0), originalContent);
        await vscode.workspace.applyEdit(originalEdit);
        
        await vscode.workspace.openTextDocument(newUri);
        const newEdit = new vscode.WorkspaceEdit();
        newEdit.insert(newUri, new vscode.Position(0, 0), newContent);
        await vscode.workspace.applyEdit(newEdit);
        
        // Ask user for confirmation
        const result = await vscode.window.showInformationMessage(
            `Apply changes to ${fileName}?`,
            { modal: true },
            'Apply',
            'Cancel'
        );
        
        return result === 'Apply';
    } catch (error) {
        console.error('Error showing diff preview:', error);
        // If there's an error with the diff preview, fall back to just asking
        const result = await vscode.window.showInformationMessage(
            `Apply changes to ${fileName}? (Diff preview failed)`,
            { modal: true },
            'Apply',
            'Cancel'
        );
        return result === 'Apply';
    } finally {
        // Close the diff editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
}

module.exports = {
    showDiffPreview
};