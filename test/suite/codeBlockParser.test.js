const assert = require('assert');
const { parseCodeBlocks, isPartialCodeUpdate } = require('../../src/codeBlockParser');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

// Use Mocha's describe for grouping tests
describe('Code Block Parser Tests', function() {
    // Use it for individual test cases
    it('should parse code blocks with file paths', function() {
        const text = `
            Here's some code to create a hello world program:

            src/hello.js
            \`\`\`javascript
            console.log('Hello world!');
            \`\`\`

            And another file:

            src/goodbye.js
            \`\`\`javascript
            console.log('Goodbye!');
            \`\`\`
        `;

        const blocks = parseCodeBlocks(text);
        assert.strictEqual(blocks.length, 2);
        assert.strictEqual(blocks[0].filePath, 'src/hello.js');
        assert.strictEqual(blocks[0].code, "console.log('Hello world!');");
        assert.strictEqual(blocks[0].language, 'javascript');
    });

    it('should detect partial code updates', function() {
        const completeFile = `
            const fs = require('fs');
            
            function readFile(path) {
                return fs.readFileSync(path, 'utf8');
            }
            
            function writeFile(path, content) {
                return fs.writeFileSync(path, content);
            }
            
            module.exports = { readFile, writeFile };
        `;
        
        const partialUpdate = `
            function readFile(path) {
                // New implementation with error handling
                try {
                    return fs.readFileSync(path, 'utf8');
                } catch (error) {
                    console.error('Error reading file:', error);
                    return null;
                }
            }
        `;
        
        assert.strictEqual(isPartialCodeUpdate(partialUpdate), true);
        assert.strictEqual(isPartialCodeUpdate(completeFile), false);
    });
});