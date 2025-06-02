/**
 * History View Module for MateCode extension
 * Provides VS Code TreeView for displaying code application history
 */
const vscode = require('vscode');
const path = require('path');

/**
 * Tree data provider for code application history
 */
class HistoryViewProvider {
    constructor(historyManager, backupManager) {
        this.historyManager = historyManager;
        this.backupManager = backupManager;
        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changeEmitter.event;
        
        // Listen for history changes
        this.historyManager.onDidChangeHistory(() => {
            this.refresh();
        });
    }
    
    /**
     * Refresh the tree view
     */
    refresh() {
        this.changeEmitter.fire();
    }
    
    /**
     * Get TreeItem for a given element
     * @param {any} element - The history entry
     * @returns {vscode.TreeItem}
     */
    getTreeItem(element) {
        const label = `${path.basename(element.filePath)} - ${element.description || 'Applied code'}`;
        const item = new vscode.TreeItem(
            label,
            vscode.TreeItemCollapsibleState.None
        );
        
        // Add metadata
        const date = new Date(element.timestamp);
        const formattedDate = date.toLocaleString();
        item.description = formattedDate;
        
        // Add tooltip with more details
        item.tooltip = new vscode.MarkdownString(
            `**File:** ${element.filePath}\n` +
            `**Applied:** ${formattedDate}\n` +
            `**Description:** ${element.description || 'Applied code'}` +
            (element.backupPath ? `\n**Backup Available**` : '')
        );
        
        // Add context value for menus
        item.contextValue = element.backupPath ? 'historyWithBackup' : 'history';
        
        // Add command to restore backup when clicked
        if (element.backupPath) {
            item.command = {
                command: 'matecode.restoreFromHistory',
                title: 'Restore from History',
                arguments: [element]
            };
        }
        
        // Set the icon
        item.iconPath = new vscode.ThemeIcon(element.backupPath ? 'history' : 'info');
        
        return item;
    }
    
    /**
     * Get the children of an element
     * @param {any} element - The element to get children for (null for root)
     * @returns {any[]} - The children elements
     */
    getChildren(element) {
        // Root level nodes
        if (!element) {
            return this.historyManager.getHistory();
        }
        
        // No children for history entries
        return [];
    }
}

/**
 * Register the history view
 * @param {vscode.ExtensionContext} context - The extension context
 * @param {Object} historyManager - The history manager instance
 * @param {Object} backupManager - The backup manager instance
 */
function registerHistoryView(context, historyManager, backupManager) {
    // Get configuration setting for sidebar history
    const config = vscode.workspace.getConfiguration('matecode');
    const enableSidebarHistory = config.get('enableSidebarHistory', true);
    
    if (!enableSidebarHistory) {
        return;
    }
    
    // Create tree data provider
    const treeDataProvider = new HistoryViewProvider(historyManager, backupManager);
    
    // Register tree view
    const treeView = vscode.window.createTreeView('matecodeHistory', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: false
    });
    
    // Register command to restore from history
    const restoreFromHistoryCommand = vscode.commands.registerCommand(
        'matecode.restoreFromHistory',
        async (historyEntry) => {
            if (historyEntry && historyEntry.backupPath) {
                const originalUri = vscode.Uri.file(historyEntry.filePath);
                await backupManager.restoreBackup(historyEntry.backupPath, originalUri);
            }
        }
    );
    
    // Register command to refresh history view
    const refreshCommand = vscode.commands.registerCommand(
        'matecode.refreshHistory',
        () => {
            treeDataProvider.refresh();
        }
    );
    
    // Register command to clear history
    const clearHistoryCommand = vscode.commands.registerCommand(
        'matecode.clearHistory',
        async () => {
            const answer = await vscode.window.showWarningMessage(
                'Are you sure you want to clear all history?',
                'Yes',
                'No'
            );
            
            if (answer === 'Yes') {
                await historyManager.clearHistory();
                treeDataProvider.refresh();
            }
        }
    );
    
    // Add to subscriptions
    context.subscriptions.push(
        treeView,
        restoreFromHistoryCommand,
        refreshCommand,
        clearHistoryCommand
    );
    
    return treeView;
}

module.exports = {
    HistoryViewProvider,
    registerHistoryView
};