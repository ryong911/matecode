/**
 * Code Block Parser Module for Chat-Code Apply extension
 * Parses and applies code blocks from text with support for diff preview and backup/history
 */
const vscode = require('vscode');
const path = require('path');
const { showDiffPreview } = require('./diffPreview');
const { formatDocument } = require('./formatTools');

/**
 * Parses markdown code blocks from text
 * @param {string} text - The text containing markdown code blocks
 * @returns {Array<{filePath: string, code: string, language: string}>} - Array of file path, code, and language
 */
function parseCodeBlocks(text) {
    // Regex to match code blocks with file paths above them
    // This will capture:
    // - The line before the code block as potential file path
    // - The language identifier after the opening backticks
    // - The content inside triple backticks
    const codeBlockRegex = /([^\n]+?)```(?:([a-zA-Z0-9_+-]+)[^\n]*)?\\n([\\s\\S]*?)```/g;
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const potentialFilePath = match[1] ? match[1].trim() : null;
        const language = match[2] || '';
        const code = match[3] || '';
        
        // Skip blocks without a valid file path
        if (!potentialFilePath) {
            continue;
        }
        
        // Basic validation for file paths
        // Check if it looks like a file path (contains extension or /)
        if (potentialFilePath.includes('/') || potentialFilePath.includes('.')) {
            codeBlocks.push({
                filePath: potentialFilePath,
                code: code,
                language: language.toLowerCase()
            });
        }
    }
    
    return codeBlocks;
}

/**
 * Gets the best matching open file for a specific file path
 * @param {string} filePath - The file path to match
 * @returns {vscode.TextEditor|null} - The matching editor or null
 */
function findMatchingOpenFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Get all open text editors
    const editors = vscode.window.visibleTextEditors;
    
    for (const editor of editors) {
        const editorFileName = path.basename(editor.document.fileName);
        
        // Check if file names match
        if (editorFileName === fileName) {
            return editor;
        }
    }
    
    return null;
}

/**
 * Applies code blocks to files in the workspace
 * @param {Array<{filePath: string, code: string, language: string}>} codeBlocks - Array of file path, code, and language
 * @param {Object} backupManager - The backup manager instance
 * @param {Object} historyManager - The history manager instance
 */
async function applyCodeBlocks(codeBlocks, backupManager, historyManager) {
    // Check if workspace is available
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let workspacePath = null;
    
    // Get default save folder from configuration
    const config = vscode.workspace.getConfiguration('chatcodeApply');
    const defaultSaveFolder = config.get('defaultSaveFolder', '');
    const enableDiffPreview = config.get('enableDiffPreview', true);
    const enableAutoFormat = config.get('enableAutoFormat', false);
    
    // If no workspace is open, ask for save location
    if (!workspaceFolders || workspaceFolders.length === 0) {
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select folder to save files'
        });
        
        if (!folderUris || folderUris.length === 0) {
            vscode.window.showWarningMessage('No folder selected. Cannot save files.');
            return;
        }
        
        workspacePath = folderUris[0].fsPath;
    } else {
        workspacePath = workspaceFolders[0].uri.fsPath;
        
        // If default save folder is set, append it to workspace path
        if (defaultSaveFolder) {
            workspacePath = path.join(workspacePath, defaultSaveFolder);
            
            // Create the default save folder if it doesn't exist
            try {
                const dirUri = vscode.Uri.file(workspacePath);
                await vscode.workspace.fs.createDirectory(dirUri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create default save folder: ${error.message}`);
            }
        }
    }
    
    // Process each code block
    const filesToOpen = [];
    let successCount = 0;
    
    for (const { filePath, code } of codeBlocks) {
        try {
            const absolutePath = path.isAbsolute(filePath) ? 
                filePath : 
                path.join(workspacePath, filePath);
            
            const fileUri = vscode.Uri.file(absolutePath);
            const dirPath = path.dirname(absolutePath);
            const dirUri = vscode.Uri.file(dirPath);
            
            // Check if file already exists
            let fileExists = false;
            let existingContent = '';
            try {
                const fileData = await vscode.workspace.fs.readFile(fileUri);
                existingContent = new TextDecoder().decode(fileData);
                fileExists = true;
            } catch {
                // File does not exist, which is fine
                fileExists = false;
            }
            
            // If file exists and diff preview is enabled, show diff and ask for confirmation
            if (fileExists && enableDiffPreview) {
                const userAccepted = await showDiffPreview(existingContent, code, filePath);
                
                if (!userAccepted) {
                    continue;
                }
                
                // Create backup of the original file if one-click undo is enabled
                if (backupManager) {
                    const backupPath = await backupManager.createBackup(fileUri, existingContent);
                    
                    // Add entry to history if history manager is available
                    if (historyManager && backupPath) {
                        await historyManager.addHistoryEntry({
                            filePath: absolutePath,
                            backupPath: backupPath,
                            description: 'Applied code block',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } else if (fileExists) {
                // If file exists but diff preview is disabled, ask user for confirmation to overwrite
                const answer = await vscode.window.showWarningMessage(
                    `File "${filePath}" already exists. Overwrite?`,
                    'Yes', 'No'
                );
                
                if (answer !== 'Yes') {
                    continue;
                }
                
                // Create backup of the original file if one-click undo is enabled
                if (backupManager) {
                    const backupPath = await backupManager.createBackup(fileUri, existingContent);
                    
                    // Add entry to history if history manager is available
                    if (historyManager && backupPath) {
                        await historyManager.addHistoryEntry({
                            filePath: absolutePath,
                            backupPath: backupPath,
                            description: 'Applied code block',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
            
            // Create directory if it doesn't exist
            try {
                await vscode.workspace.fs.createDirectory(dirUri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create directory for ${filePath}: ${error.message}`);
                continue;
            }
            
            // Write file content
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(fileUri, encoder.encode(code));
            
            // Add to list of files to open
            filesToOpen.push(fileUri);
            successCount++;
            
            // Auto-format the file if enabled
            if (enableAutoFormat) {
                try {
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    await formatDocument(document);
                } catch (error) {
                    console.log(`Auto-formatting failed for ${filePath}:`, error);
                }
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save ${filePath}: ${error.message}`);
        }
    }
    
    // Show success message
    vscode.window.showInformationMessage(`${successCount} file(s) created/updated successfully.`);
    
    // Open files (limit to 5)
    const maxFilesToOpen = 5;
    for (let i = 0; i < Math.min(filesToOpen.length, maxFilesToOpen); i++) {
        try {
            await vscode.window.showTextDocument(filesToOpen[i], { preview: false });
        } catch (error) {
            console.error(`Failed to open ${filesToOpen[i].fsPath}:`, error);
        }
    }
    
    if (filesToOpen.length > maxFilesToOpen) {
        vscode.window.showInformationMessage(`Only opened ${maxFilesToOpen} out of ${filesToOpen.length} files to avoid cluttering.`);
    }
}

/**
 * Extracts function/method definitions from code
 * @param {string} code - The code to extract functions from
 * @returns {Array<{name: string, content: string, startIndex: number, endIndex: number}>} - Array of function details
 */
function extractFunctions(code) {
    const functions = [];
    
    // Regex patterns for common function declaration styles
    const patterns = [
        // JavaScript/TypeScript standard functions: function name() {}
        /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g,
        
        // Arrow functions: const name = () => {}
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\}/g,
        
        // Class methods: methodName() {}
        /(?:async\s+)?([\w$]+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/g,
        
        // Python functions: def name():
        /def\s+(\w+)\s*\([^)]*\)\s*:([\s\S]*?)(?=\ndef|$)/g
    ];
    
    let match;
    for (const pattern of patterns) {
        while ((match = pattern.exec(code)) !== null) {
            const name = match[1];
            const content = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + content.length;
            
            // Avoid duplicates (same function matched by multiple patterns)
            const existingFunction = functions.find(f => f.name === name);
            if (!existingFunction) {
                functions.push({ name, content, startIndex, endIndex });
            }
        }
    }
    
    return functions;
}

/**
 * Determines if a code block contains partial updates
 * @param {string} code - The code to analyze
 * @returns {boolean} - True if the code appears to be a partial update
 */
function isPartialCodeUpdate(code) {
    // Heuristics to detect if this is a full file or partial code update
    
    // Check if there are multiple function definitions
    const functionCount = extractFunctions(code).length;
    
    // Check for common indicators of partial updates
    const hasImportsOrRequires = /^\s*(import|const\s+.*\s*=\s*require)/.test(code);
    const hasClassDefinition = /^\s*class\s+\w+/.test(code);
    const hasFileExtension = /^\s*\.\w+$/.test(code);
    
    // If the code has imports/requires at the top and class definitions,
    // it's more likely to be a complete file
    if (hasImportsOrRequires && (hasClassDefinition || functionCount > 3)) {
        return false;
    }
    
    // If it's a very short snippet with just one or two functions,
    // it's likely a partial update
    if (functionCount > 0 && functionCount <= 3 && !hasImportsOrRequires && !hasFileExtension) {
        return true;
    }
    
    // Detect specific function update patterns ("Update the X function to...")
    if (code.trim().startsWith('function') || code.trim().startsWith('async function')) {
        return true;
    }
    
    // Default to assuming it's a complete file replacement
    return false;
}

/**
 * Applies partial code updates to a document
 * @param {vscode.TextDocument} document - The document to update
 * @param {string} newCode - The new code containing updates
 * @returns {vscode.WorkspaceEdit} - The edit to apply
 */
function createPartialUpdateEdit(document, newCode) {
    const edit = new vscode.WorkspaceEdit();
    const currentText = document.getText();
    
    // Extract functions from both current document and new code
    const currentFunctions = extractFunctions(currentText);
    const newFunctions = extractFunctions(newCode);
    
    // Track if we've made any replacements
    let madeReplacements = false;
    
    // For each function in the new code
    for (const newFunc of newFunctions) {
        // Find matching function by name in current document
        const matchingFunc = currentFunctions.find(f => f.name === newFunc.name);
        
        if (matchingFunc) {
            // Create a range for the matching function in the current document
            const startPos = document.positionAt(matchingFunc.startIndex);
            const endPos = document.positionAt(matchingFunc.endIndex);
            const range = new vscode.Range(startPos, endPos);
            
            // Replace the function with the new implementation
            edit.replace(document.uri, range, newFunc.content);
            madeReplacements = true;
        }
    }
    
    // If no specific functions were replaced but we have code,
    // check if the new code might be a complete section or class that exists in the file
    if (!madeReplacements && newCode.trim().length > 0) {
        // Look for the updated section in the current document
        const newCodeTrimmed = newCode.trim();
        
        // Try to find key parts of the new code in the existing file
        // (e.g., function signatures, class names, etc.)
        const lines = currentText.split('\n');
        let foundSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            // Extract key identifiers from the new code (function names, class names)
            const identifiers = newCodeTrimmed.match(/(?:function|class)\s+(\w+)/g);
            
            if (identifiers && identifiers.length > 0) {
                for (const identifier of identifiers) {
                    if (lines[i].includes(identifier)) {
                        // Found a potential match, now find the section boundaries
                        let startLine = i;
                        let endLine = i;
                        
                        // Look backward for the start (empty line or bracket)
                        while (startLine > 0 && !/^\s*$|\{\s*$/.test(lines[startLine - 1])) {
                            startLine--;
                        }
                        
                        // Look forward for the end (closing bracket or empty line)
                        while (endLine < lines.length - 1 && !/^\s*\}\s*$|^\s*$/.test(lines[endLine + 1])) {
                            endLine++;
                        }
                        
                        if (endLine > startLine) {
                            // Create a range for this section
                            const startPos = new vscode.Position(startLine, 0);
                            const endPos = new vscode.Position(endLine + 1, 0);
                            const range = new vscode.Range(startPos, endPos);
                            
                            // Replace the section with the new code
                            edit.replace(document.uri, range, newCode);
                            foundSection = true;
                            madeReplacements = true;
                            break;
                        }
                    }
                }
            }
            
            if (foundSection) break;
        }
    }
    
    // If we couldn't find matching functions or sections, fall back to replacing the entire file
    if (!madeReplacements) {
        const fullRange = new vscode.Range(
            0, 0,
            document.lineCount, 0
        );
        edit.replace(document.uri, fullRange, newCode);
    }
    
    return edit;
}

/**
 * Applies code blocks directly to matching open files, or creates new files
 * @param {Array<{filePath: string, code: string, language: string}>} codeBlocks - Array of file path, code, and language pairs
 * @param {Object} backupManager - The backup manager instance
 * @param {Object} historyManager - The history manager instance
 */
async function applyCodeBlocksToOpenFiles(codeBlocks, backupManager, historyManager) {
    // Check if workspace is available
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let workspacePath = null;
    
    // Get configuration settings
    const config = vscode.workspace.getConfiguration('chatcodeApply');
    const defaultSaveFolder = config.get('defaultSaveFolder', '');
    const enableDiffPreview = config.get('enableDiffPreview', true);
    const enableAutoFormat = config.get('enableAutoFormat', false);
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select folder to save files'
        });
        
        if (!folderUris || folderUris.length === 0) {
            vscode.window.showWarningMessage('No folder selected. Cannot save files.');
            return;
        }
        
        workspacePath = folderUris[0].fsPath;
    } else {
        workspacePath = workspaceFolders[0].uri.fsPath;
        
        // If default save folder is set, append it to workspace path
        if (defaultSaveFolder) {
            workspacePath = path.join(workspacePath, defaultSaveFolder);
        }
    }
    
    // Process each code block
    const filesToOpen = [];
    let successCount = 0;
    
    for (const { filePath, code } of codeBlocks) {
        try {
            // Try to find a matching open file
            const matchingEditor = findMatchingOpenFile(filePath);
            
            if (matchingEditor) {
                // Apply code to the open file
                const document = matchingEditor.document;
                
                // Create backup before making changes if one-click undo is enabled
                if (backupManager) {
                    const originalContent = document.getText();
                    const backupPath = await backupManager.createBackup(document.uri, originalContent);
                    
                    // Add entry to history if history manager is available
                    if (historyManager && backupPath) {
                        await historyManager.addHistoryEntry({
                            filePath: document.uri.fsPath,
                            backupPath: backupPath,
                            description: 'Applied code to open file',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                // Check if this is a partial update
                const isPartialUpdate = isPartialCodeUpdate(code);
                
                // Show diff preview if enabled
                if (enableDiffPreview) {
                    const originalContent = document.getText();
                    const userAccepted = await showDiffPreview(
                        originalContent,
                        code,
                        path.basename(document.fileName)
                    );
                    
                    if (!userAccepted) {
                        continue;
                    }
                }
                
                let edit;
                if (isPartialUpdate) {
                    // Create a partial update edit
                    edit = createPartialUpdateEdit(document, code);
                    await vscode.workspace.applyEdit(edit);
                    
                    // Show notification about partial update
                    vscode.window.showInformationMessage(
                        `Applied partial update to ${path.basename(filePath)}.`
                    );
                } else {
                    // Full file replacement
                    const fullRange = new vscode.Range(
                        0, 0,
                        document.lineCount, 0
                    );
                    
                    edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, fullRange, code);
                    await vscode.workspace.applyEdit(edit);
                }
                
                await document.save();
                
                // Auto-format the document if enabled
                if (enableAutoFormat) {
                    await formatDocument(document);
                }
                
                successCount++;
            } else {
                // If no matching file is found, ask if we should create a new file
                const answer = await vscode.window.showInformationMessage(
                    `No matching open file found for "${filePath}". Create a new file?`,
                    'Yes', 'No'
                );
                
                if (answer !== 'Yes') {
                    continue;
                }
                
                // Create a new file
                const absolutePath = path.isAbsolute(filePath) ? 
                    filePath : 
                    path.join(workspacePath, filePath);
                
                const fileUri = vscode.Uri.file(absolutePath);
                const dirPath = path.dirname(absolutePath);
                const dirUri = vscode.Uri.file(dirPath);
                
                // Create directory if it doesn't exist
                try {
                    await vscode.workspace.fs.createDirectory(dirUri);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create directory for ${filePath}: ${error.message}`);
                    continue;
                }
                
                // Write file content
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(fileUri, encoder.encode(code));
                
                // Add to list of files to open
                filesToOpen.push(fileUri);
                successCount++;
                
                // Auto-format the new file if enabled
                if (enableAutoFormat) {
                    try {
                        const document = await vscode.workspace.openTextDocument(fileUri);
                        await formatDocument(document);
                    } catch (error) {
                        console.log(`Auto-formatting failed for ${filePath}:`, error);
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply code for ${filePath}: ${error.message}`);
        }
    }
    
    // Show success message
    vscode.window.showInformationMessage(`${successCount} file(s) created/updated successfully.`);
    
    // Open new files (limit to 5)
    const maxFilesToOpen = 5;
    for (let i = 0; i < Math.min(filesToOpen.length, maxFilesToOpen); i++) {
        try {
            await vscode.window.showTextDocument(filesToOpen[i], { preview: false });
        } catch (error) {
            console.error(`Failed to open ${filesToOpen[i].fsPath}:`, error);
        }
    }
}

module.exports = {
    parseCodeBlocks,
    applyCodeBlocks,
    applyCodeBlocksToOpenFiles,
    findMatchingOpenFile,
    extractFunctions,
    isPartialCodeUpdate,
    createPartialUpdateEdit
};