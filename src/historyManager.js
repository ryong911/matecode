/**
 * History Manager Module for Chat-Code Apply extension
 * Manages history of code applications for browsing and restoring
 */
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Manages history of code applications
 */
class HistoryManager {
    constructor() {
        this.historyFile = '';
        this.history = [];
        this.maxHistoryItems = 50;
        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeHistory = this.changeEmitter.event;
        
        // Initialize history
        this.initialize();
    }
    
    /**
     * Initialize the history manager
     */
    initialize() {
        // Get configuration for history
        const config = vscode.workspace.getConfiguration('chatcodeApply');
        const enableSidebarHistory = config.get('enableSidebarHistory', true);
        
        if (!enableSidebarHistory) {
            return;
        }
        
        // Set maximum history items from configuration
        this.maxHistoryItems = config.get('maxHistoryItems', 50);
        
        // Get backup location from settings or use default
        let backupLocation = config.get('backupLocation', '~/.chat-code-apply/backup');
        
        // Handle home directory expansion
        if (backupLocation.startsWith('~')) {
            backupLocation = backupLocation.replace('~', os.homedir());
        }
        
        // Set history file path
        const historyDir = backupLocation;
        this.historyFile = path.join(historyDir, 'history.json');
        
        // Create history directory if it doesn't exist
        try {
            if (!fs.existsSync(historyDir)) {
                fs.mkdirSync(historyDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create history directory:', error);
        }
        
        // Load history
        this.loadHistory();
    }
    
    /**
     * Load history from file
     */
    loadHistory() {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = fs.readFileSync(this.historyFile, 'utf8');
                this.history = JSON.parse(data);
            } else {
                this.history = [];
            }
            
            // Verify each history entry has a valid backup
            this.history = this.history.filter(entry => {
                return entry.backupPath && fs.existsSync(entry.backupPath);
            });
            
            // Notify listeners that history has changed
            this.changeEmitter.fire();
        } catch (error) {
            console.error('Error loading history:', error);
            this.history = [];
        }
    }
    
    /**
     * Save history to file
     */
    saveHistory() {
        try {
            fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }
    
    /**
     * Add an entry to the history
     * @param {Object} entry - The history entry
     * @param {string} entry.filePath - The path to the file
     * @param {string} entry.backupPath - The path to the backup file
     * @param {string} entry.description - Description of what was done
     * @param {string} entry.timestamp - Timestamp of when it was done
     * @returns {Promise<boolean>} - True if the entry was added successfully
     */
    async addHistoryEntry(entry) {
        try {
            // Check if sidebar history is enabled
            const config = vscode.workspace.getConfiguration('chatcodeApply');
            const enableSidebarHistory = config.get('enableSidebarHistory', true);
            
            if (!enableSidebarHistory) {
                return false;
            }
            
            // Validate entry
            if (!entry.filePath || !entry.backupPath) {
                return false;
            }
            
            // Set timestamp if not provided
            if (!entry.timestamp) {
                entry.timestamp = new Date().toISOString();
            }
            
            // Add entry to beginning of history
            this.history.unshift(entry);
            
            // Trim history if needed
            if (this.history.length > this.maxHistoryItems) {
                this.history = this.history.slice(0, this.maxHistoryItems);
            }
            
            // Save history to file
            this.saveHistory();
            
            // Notify listeners that history has changed
            this.changeEmitter.fire();
            
            return true;
        } catch (error) {
            console.error('Error adding history entry:', error);
            return false;
        }
    }
    
    /**
     * Get the history
     * @returns {Array<Object>} - The history entries
     */
    getHistory() {
        return this.history;
    }
    
    /**
     * Clear all history
     * @returns {Promise<boolean>} - True if history was cleared successfully
     */
    async clearHistory() {
        try {
            this.history = [];
            this.saveHistory();
            
            // Notify listeners that history has changed
            this.changeEmitter.fire();
            
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }
}

module.exports = {
    HistoryManager
};