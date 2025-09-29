#!/usr/bin/env node
/**
 * Script to automatically fix insecure logging patterns in the codebase
 */

const fs = require('fs');
const path = require('path');

class InsecureLoggingFixer {
  constructor() {
    this.fixes = [
      {
        name: 'API Key Error Logging',
        pattern: /console\.(error|warn)\(['"`]Error: Invalid API key format['"`]\)/g,
        replacement: 'secureLogger.$1(\'Error: Invalid API key format\')',
        requiresImport: true
      },
      {
        name: 'API Key Presence Warning',
        pattern: /console\.warn\(['"`]Skipping .* test - no OPENROUTER_API_KEY found['"`]\)/g,
        replacement: 'secureLogger.warn(\'Skipping test - API key not configured\')',
        requiresImport: true
      },
      {
        name: 'Environment Disclosure',
        pattern: /console\.log\(['"`]Database connection string:['"`], process\.env\.DATABASE_URL\)/g,
        replacement: 'secureLogger.info(\'Database connection configured:\', !!process.env.DATABASE_URL)',
        requiresImport: true
      }
    ];
    
    this.secureLoggerImport = "import { secureLogger } from '../utils/secureLogger';";
  }

  fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modifiedContent = content;
    let hasChanges = false;
    let needsImport = false;

    // Apply fixes
    for (const fix of this.fixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        console.log(`🔧 Fixing ${fix.name} in ${path.relative(process.cwd(), filePath)}`);
        modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
        hasChanges = true;
        if (fix.requiresImport) {
          needsImport = true;
        }
      }
    }

    // Add import if needed and not already present
    if (needsImport && !content.includes('secureLogger')) {
      // Find the position to insert the import
      const lines = modifiedContent.split('\n');
      let insertIndex = 0;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^import .* from/)) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, this.secureLoggerImport);
      modifiedContent = lines.join('\n');
      console.log(`📦 Added secureLogger import to ${path.relative(process.cwd(), filePath)}`);
    }

    // Write changes if any
    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent);
      return true;
    }
    
    return false;
  }

  fixDirectory(dir = process.cwd()) {
    const files = this.getAllTypeScriptFiles(dir);
    let fixedFiles = 0;

    console.log(`🔍 Scanning ${files.length} TypeScript files for insecure logging patterns...\n`);

    for (const file of files) {
      if (this.fixFile(file)) {
        fixedFiles++;
      }
    }

    console.log(`\n✅ Fixed insecure logging in ${fixedFiles} files`);
    
    if (fixedFiles > 0) {
      console.log('\n📝 Next steps:');
      console.log('1. Review the changes to ensure they are correct');
      console.log('2. Run your tests to ensure everything still works');
      console.log('3. Run the security scanner to verify fixes: node scripts/security-scan.js');
    }
  }

  getAllTypeScriptFiles(dir) {
    const files = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'out', 'coverage'];
    
    const traverse = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.some(excluded => fullPath.includes(excluded))) {
            traverse(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return files;
  }
}

// CLI usage
if (require.main === module) {
  const fixer = new InsecureLoggingFixer();
  fixer.fixDirectory();
}

module.exports = { InsecureLoggingFixer };