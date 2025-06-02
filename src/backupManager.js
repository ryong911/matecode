/**
 * Backup Manager Module for Chat-Code Apply extension
 * Handles file backups for one-click undo functionality
 */
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Manages file backups for one-click undo functionality
 */
class BackupManager {
    constructor() {
        this.backupDir = '';
        this.maxBackups = 50;
        this.backupHistory = [];
    }
    
    /**
     * Initialize the backup directory
     */
    async initialize() {
        // Get configuration for backups
        const config = vscode.workspace.getConfiguration('chatcodeApply');
        const enableOneClickUndo = config.get('enableOneClickUndo', true);
        
        if (!enableOneClickUndo) {
            return;
        }
        
        // Get backup location from settings or use default
        let backupLocation = config.get('backupLocation', '~/.chat-code-apply/backup');
        
        // Handle home directory expansion
        if (backupLocation.startsWith('~')) {
            backupLocation = backupLocation.replace('~', os.homedir());
        }
        
        this.backupDir = backupLocation;
        this.maxBackups = config.get('maxHistoryItems', 50);
        
        // Create backup directory if it doesn't exist
        try {
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create backup directory:', error);
            vscode.window.showErrorMessage(`Failed to create backup directory: ${error.message}`);
        }
        
        // Load existing backups
        this.loadBackupHistory();
    }
    
    /**
     * Load the backup history from the backup directory
     */
    loadBackupHistory() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                return;
            }
            
            // Read backup directory and sort files by modification time
            const files = fs.readdirSync(this.backupDir);
            this.backupHistory = files
                .map(file => path.join(this.backupDir, file))
                .filter(file => fs.statSync(file).isFile())
                .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
                
            // Trim to max backups
            if (this.backupHistory.length > this.maxBackups) {
                // Remove excess backups
                for (let i = this.maxBackups; i < this.backupHistory.length; i++) {
                    try {
                        fs.unlinkSync(this.backupHistory[i]);
                    } catch (error) {
                        console.error(`Failed to remove old backup ${this.backupHistory[i]}:`, error);
                    }
                }
                
                this.backupHistory = this.backupHistory.slice(0, this.maxBackups);
            }
        } catch (error) {
            console.error('Error loading backup history:', error);
        }
    }
    
    /**
     * Create a backup of a file
     * @param {vscode.Uri} fileUri - The URI of the file to backup
     * @param {string} content - The content to backup
     * @returns {Promise<string|null>} - The path to the backup file or null if backup failed
     */
    async createBackup(fileUri, content) {
        // Check if one-click undo is enabled
        const config = vscode.workspace.getConfiguration('chatcodeApply');
        const enableOneClickUndo = config.get('enableOneClickUndo', true);
        
        if (!enableOneClickUndo) {
            return null;
        }
        
        try {
            if (!this.backupDir) {
                await this.initialize();
            }
            
            // Create filename for backup based on original file
            const fileName = path.basename(fileUri.fsPath);
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const backupFileName = `${fileName}.${timestamp}.bak`;
            const backupPath = path.join(this.backupDir, backupFileName);
            
            // Write backup file
            fs.writeFileSync(backupPath, content);
            
            // Update backup history
            this.backupHistory.unshift(backupPath);
            
            // Trim excess backups
            if (this.backupHistory.length > this.maxBackups) {
                try {
                    fs.unlinkSync(this.backupHistory.pop());
                } catch (error) {
                    console.error('Failed to remove oldest backup:', error);
                }
            }
            
            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error);
            vscode.window.showErrorMessage(`Failed to create backup: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Restore a backup file to its original location
     * @param {string} backupPath - The path to the backup file
     * @param {vscode.Uri} originalUri - The URI of the original file
     * @returns {Promise<boolean>} - True if restore was successful
     */
    async restoreBackup(backupPath, originalUri) {
        try {
            // Read backup content
            const content = fs.readFileSync(backupPath, 'utf8');
            
            // Write to original file
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(originalUri, encoder.encode(content));
            
            // Show success message
            vscode.window.showInformationMessage(`Successfully restored ${path.basename(originalUri.fsPath)}`);
            
            // Open the restored file
            await vscode.window.showTextDocument(originalUri);
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            vscode.window.showErrorMessage(`Failed to restore from backup: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Revert the last applied change
     * @returns {Promise<boolean>} - True if revert was successful
     */
    async revertLastApply() {
        try {
            if (this.backupHistory.length === 0) {
                vscode.window.showInformationMessage('No backup found for one-click undo.');
                return false;
            }
            
            const lastBackup = this.backupHistory[0];
            
            // Extract original file path from the backup filename
            let originalFileName = path.basename(lastBackup);
            
            // Remove timestamp and .bak extension
            originalFileName = originalFileName.split('.').slice(0, -2).join('.');
            
            // Ask user to select workspace if multiple workspaces
            let workspacePath = null;
            const workspaceFolders = vscode.workspace.workspaceFolders;
            
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace open. Please open a workspace to restore files.');
                return false;
            } else if (workspaceFolders.length === 1) {
                workspacePath = workspaceFolders[0].uri.fsPath;
            } else {
                // Multiple workspaces, ask user to pick one
                const options = workspaceFolders.map(folder => ({
                    label: folder.name,
                    description: folder.uri.fsPath,
                    uri: folder.uri
                }));
                
                const workspace = await vscode.window.showQuickPick(options, {
                    placeHolder: 'Select workspace to restore file to'
                });
                
                if (!workspace) {
                    return false;
                }
                
                workspacePath = workspace.uri.fsPath;
            }
            
            // Look for matching files in workspace
            const matches = [];
            await this.findFiles(workspacePath, originalFileName, matches);
            
            let targetUri;
            
            if (matches.length === 0) {
                vscode.window.showWarningMessage(`No matching file found for ${originalFileName}. Showing backup content.`);
                
                // Show backup content in a new untitled document
                const document = await vscode.workspace.openTextDocument({
                    content: fs.readFileSync(lastBackup, 'utf8')
                });
                
                await vscode.window.showTextDocument(document);
                return true;
            } else if (matches.length === 1) {
                targetUri = vscode.Uri.file(matches[0]);
            } else {
                // Multiple matches, ask user to pick one
                const options = matches.map(match => ({
                    label: path.basename(match),
                    description: match,
                    fsPath: match
                }));
                
                const selectedFile = await vscode.window.showQuickPick(options, {
                    placeHolder: 'Multiple matching files found. Select which to restore.'
                });
                
                if (!selectedFile) {
                    return false;
                }
                
                targetUri = vscode.Uri.file(selectedFile.fsPath);
            }
            
            // Restore the backup
            return await this.restoreBackup(lastBackup, targetUri);
            
        } catch (error) {
            console.error('Error in revertLastApply:', error);
            vscode.window.showErrorMessage(`Failed to revert last change: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Recursively find files matching a name
     * @param {string} dir - The directory to search
     * @param {string} fileName - The file name to match
     * @param {Array<string>} results - Array to store results
     */
    async findFiles(dir, fileName, results) {
        try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                
                if (fs.statSync(fullPath).isDirectory()) {
                    // Skip node_modules and .git directories
                    if (file !== 'node_modules' && file !== '.git') {
                        await this.findFiles(fullPath, fileName, results);
                    }
                } else if (file === fileName) {
                    results.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error searching directory ${dir}:`, error);
        }
    }
}

module.exports = {
    BackupManager
};