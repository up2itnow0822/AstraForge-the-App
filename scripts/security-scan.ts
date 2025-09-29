#!/usr/bin/env node
/**
 * AstraForge Security Scanner - API Leak Detection
 * Scans the codebase for potential API key leaks and security vulnerabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface SecurityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  file: string;
  line?: number;
  content: string;
  recommendation: string;
}

interface ScanResult {
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

class SecurityScanner {
  private readonly rootDir: string;
  private readonly excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    'out',
    'coverage',
    '.vscode'
  ];

  // API key patterns that should never be in code
  private readonly apiKeyPatterns = [
    {
      name: 'OpenAI API Key',
      pattern: /sk-[a-zA-Z0-9]{32,}/g,
      severity: 'CRITICAL' as const
    },
    {
      name: 'OpenRouter API Key',
      pattern: /sk-or-v1-[a-fA-F0-9]{64}/g,
      severity: 'CRITICAL' as const
    },
    {
      name: 'Anthropic API Key',
      pattern: /sk-ant-[a-zA-Z0-9_-]{95,}/g,
      severity: 'CRITICAL' as const
    },
    {
      name: 'GitHub Token',
      pattern: /ghp_[a-zA-Z0-9]{36}/g,
      severity: 'CRITICAL' as const
    },
    {
      name: 'xAI API Key',
      pattern: /xai-[a-zA-Z0-9_-]{20,}/g,
      severity: 'CRITICAL' as const
    }
  ];

  // Suspicious logging patterns
  private readonly suspiciousLogPatterns = [
    {
      name: 'API Key Logging',
      pattern: /console\.(log|info|debug|warn|error).*(?:apiKey|API_KEY|api.*key)/gi,
      severity: 'HIGH' as const
    },
    {
      name: 'Authorization Header Logging',
      pattern: /console\.(log|info|debug|warn|error).*(?:Authorization|Bearer)/gi,
      severity: 'HIGH' as const
    },
    {
      name: 'Full Environment Logging',
      pattern: /console\.(log|info|debug|warn|error).*process\.env(?!\.[A-Z_]+\s*\?\s*['"]Present['"])/gi,
      severity: 'MEDIUM' as const
    }
  ];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  async scan(): Promise<ScanResult> {
    const issues: SecurityIssue[] = [];
    
    console.log('🔍 Starting security scan...\n');

    // Scan for hardcoded API keys
    issues.push(...await this.scanForApiKeys());
    
    // Scan for suspicious logging
    issues.push(...await this.scanForSuspiciousLogging());
    
    // Check .env files
    issues.push(...await this.checkEnvFiles());
    
    // Check git history for leaked secrets
    issues.push(...await this.checkGitHistory());

    // Generate summary
    const summary = {
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length
    };

    return { issues, summary };
  }

  private async scanForApiKeys(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    console.log('🔑 Scanning for hardcoded API keys...');
    
    const files = this.getAllFiles(['.ts', '.js', '.json', '.md', '.txt']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (const pattern of this.apiKeyPatterns) {
        let match;
        while ((match = pattern.pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const line = lines[lineNumber - 1];
          
          // Skip test files with obvious fake keys
          if (this.isFakeTestKey(match[0], file, line)) {
            continue;
          }
          
          issues.push({
            severity: pattern.severity,
            type: `Hardcoded ${pattern.name}`,
            file: path.relative(this.rootDir, file),
            line: lineNumber,
            content: line.trim(),
            recommendation: `Remove hardcoded API key and use environment variables. Consider rotating this key if it's real.`
          });
        }
      }
    }
    
    return issues;
  }

  private async scanForSuspiciousLogging(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    console.log('📝 Scanning for suspicious logging patterns...');
    
    const files = this.getAllFiles(['.ts', '.js']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (const pattern of this.suspiciousLogPatterns) {
        let match;
        while ((match = pattern.pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const line = lines[lineNumber - 1];
          
          issues.push({
            severity: pattern.severity,
            type: pattern.name,
            file: path.relative(this.rootDir, file),
            line: lineNumber,
            content: line.trim(),
            recommendation: `Avoid logging sensitive information. Use redacted logging or remove sensitive data before logging.`
          });
        }
      }
    }
    
    return issues;
  }

  private async checkEnvFiles(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    console.log('🌍 Checking environment files...');
    
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(this.rootDir, envFile);
      
      if (fs.existsSync(envPath)) {
        // Check if .env is in git
        try {
          execSync(`git ls-files --error-unmatch ${envFile}`, { 
            cwd: this.rootDir, 
            stdio: 'ignore' 
          });
          
          issues.push({
            severity: 'CRITICAL',
            type: 'Environment File in Git',
            file: envFile,
            content: `${envFile} is tracked by git`,
            recommendation: `Remove ${envFile} from git tracking and add to .gitignore immediately.`
          });
        } catch {
          // File is not tracked, which is good
        }
        
        // Check for real API keys in env file
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const pattern of this.apiKeyPatterns) {
          if (pattern.pattern.test(content)) {
            issues.push({
              severity: 'HIGH',
              type: 'Real API Keys in Environment File',
              file: envFile,
              content: 'Contains what appears to be real API keys',
              recommendation: `Ensure ${envFile} is not committed to version control and contains only development/test keys.`
            });
          }
        }
      }
    }
    
    return issues;
  }

  private async checkGitHistory(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    console.log('📚 Checking git history for leaked secrets...');
    
    try {
      // Check recent commits for potential secrets
      const gitLog = execSync('git log --oneline -10', { 
        cwd: this.rootDir, 
        encoding: 'utf-8' 
      });
      
      for (const pattern of this.apiKeyPatterns) {
        if (pattern.pattern.test(gitLog)) {
          issues.push({
            severity: 'CRITICAL',
            type: 'API Key in Git History',
            file: 'git history',
            content: 'API key pattern found in recent commit messages',
            recommendation: 'Review git history and consider using git filter-branch or BFG to remove secrets from history.'
          });
        }
      }
    } catch (error) {
      // Git history check failed, skip
    }
    
    return issues;
  }

  private getAllFiles(extensions: string[]): string[] {
    const files: string[] = [];
    
    const traverse = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip excluded directories
          if (!this.excludeDirs.some(excluded => 
            fullPath.includes(path.sep + excluded + path.sep) || 
            fullPath.endsWith(path.sep + excluded)
          )) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    traverse(this.rootDir);
    return files;
  }

  private isFakeTestKey(key: string, file: string, line: string): boolean {
    // Check if this is in a test file
    const isTestFile = /\.(test|spec)\.(ts|js)$/.test(file) || 
                      file.includes('/tests/') || 
                      file.includes('test');
    
    if (!isTestFile) return false;
    
    // Check for obvious test patterns
    const testPatterns = [
      /1234567890abcdef/i,
      /test.*key/i,
      /fake.*key/i,
      /mock.*key/i,
      /example.*key/i
    ];
    
    return testPatterns.some(pattern => pattern.test(key) || pattern.test(line));
  }

  printReport(result: ScanResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY SCAN REPORT');
    console.log('='.repeat(60));
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   🚨 Critical: ${result.summary.critical}`);
    console.log(`   ⚠️  High:     ${result.summary.high}`);
    console.log(`   🔶 Medium:   ${result.summary.medium}`);
    console.log(`   ℹ️  Low:      ${result.summary.low}`);
    console.log(`   📝 Total:    ${result.issues.length}`);
    
    if (result.issues.length === 0) {
      console.log('\n✅ No security issues found!');
      return;
    }
    
    // Group issues by severity
    const groupedIssues = {
      CRITICAL: result.issues.filter(i => i.severity === 'CRITICAL'),
      HIGH: result.issues.filter(i => i.severity === 'HIGH'),
      MEDIUM: result.issues.filter(i => i.severity === 'MEDIUM'),
      LOW: result.issues.filter(i => i.severity === 'LOW')
    };
    
    // Print issues by severity
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      if (issues.length === 0) continue;
      
      const icon = severity === 'CRITICAL' ? '🚨' : 
                   severity === 'HIGH' ? '⚠️' : 
                   severity === 'MEDIUM' ? '🔶' : 'ℹ️';
      
      console.log(`\n${icon} ${severity} ISSUES (${issues.length}):`);
      console.log('-'.repeat(40));
      
      for (const issue of issues) {
        console.log(`\n📁 File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`🏷️  Type: ${issue.type}`);
        console.log(`📝 Content: ${issue.content}`);
        console.log(`💡 Recommendation: ${issue.recommendation}`);
      }
    }
    
    // Security recommendations
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  SECURITY RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (result.summary.critical > 0) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Rotate any exposed API keys immediately');
      console.log('   2. Remove hardcoded secrets from code');
      console.log('   3. Add secrets to .gitignore');
      console.log('   4. Use environment variables for all secrets');
    }
    
    if (result.summary.high > 0) {
      console.log('\n⚠️  HIGH PRIORITY:');
      console.log('   1. Review and fix suspicious logging');
      console.log('   2. Implement secure logging practices');
      console.log('   3. Use redacted logging for sensitive data');
    }
    
    console.log('\n🔒 GENERAL SECURITY BEST PRACTICES:');
    console.log('   1. Never commit .env files to version control');
    console.log('   2. Use environment variables for all secrets');
    console.log('   3. Rotate API keys regularly');
    console.log('   4. Use pre-commit hooks to prevent secret commits');
    console.log('   5. Consider using a secrets management service');
    console.log('   6. Regularly scan for exposed secrets');
  }
}

// CLI usage
if (require.main === module) {
  const scanner = new SecurityScanner();
  
  scanner.scan().then(result => {
    scanner.printReport(result);
    
    // Exit with error code if critical issues found
    if (result.summary.critical > 0) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Security scan failed:', error);
    process.exit(1);
  });
}

export { SecurityScanner, SecurityIssue, ScanResult };