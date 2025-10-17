# 🔒 AstraForge Security Guidelines

## 🚨 Critical Security Issues Found and Fixed

During our security audit, we identified several critical API key leaks in the codebase. This document outlines the issues found, fixes applied, and best practices to prevent future security vulnerabilities.

## 📋 Issues Identified

### 🚨 CRITICAL Issues Fixed

1. **Hardcoded API Keys in Documentation**
   - **Issue**: Real OpenRouter API key `sk-or-v1-[REDACTED_64_CHARS]` exposed in multiple documentation files
   - **Files Affected**:
     - `docs/ENV_MAPPING_COMPLETE.md`
     - Legacy onboarding guides removed from the repository during the V3 cleanup
   - **Fix Applied**: Replaced hardcoded keys with environment variable references (`$OPENROUTER_API_KEY`)

2. **Environment File in Git Tracking**
   - **Issue**: `.env` file containing real API keys was tracked by git
   - **Fix Applied**: Removed `.env` from git tracking and ensured it's in `.gitignore`

3. **API Key Logging in Debug Scripts**
   - **Issue**: Debug script logged partial API keys
   - **File**: Legacy debug tooling removed from the repository during the V3 cleanup
   - **Fix Applied**: Replaced partial key logging with redacted format in supported tooling

### ⚠️ HIGH Priority Issues

1. **Unsafe Logging Patterns**
   - **Issue**: Multiple files log API key validation messages that could expose sensitive data
   - **Fix Applied**: Created `secureLogger.ts` utility for safe logging

2. **Real API Keys in Environment Files**
   - **Issue**: Development environment files contained what appeared to be real API keys
   - **Recommendation**: Use only test/development keys in committed examples

## 🛡️ Security Fixes Implemented

### 1. Secure Logging Utility (`src/utils/secureLogger.ts`)

Created a comprehensive secure logging utility that:
- Automatically redacts API keys from log messages
- Masks authorization headers
- Sanitizes database URLs with credentials
- Provides safe methods for logging API validation results

```typescript
import { secureLogger } from '../utils/secureLogger';

// Safe API key validation logging
secureLogger.logApiKeyValidation('OpenRouter', true, 64);

// Safe API request logging
secureLogger.logApiRequest('OpenRouter', '/v1/chat/completions', 200, 'gpt-4');

// Safe environment status logging
secureLogger.logEnvironmentStatus();
```

### 2. Security Scanner (`scripts/security-scan.js`)

Implemented a comprehensive security scanner that detects:
- Hardcoded API keys in code
- Suspicious logging patterns
- Environment files in git tracking
- API key patterns in git history

```bash
# Run security scan
node scripts/security-scan.js
```

### 3. Updated Documentation

- Replaced all hardcoded API keys with environment variable references
- Added security warnings to setup documentation
- Created this comprehensive security guide

## 🔧 Immediate Actions Required

### For Repository Maintainers

1. **⚠️ CRITICAL: Rotate Exposed API Keys**
   ```bash
   # The following key was exposed and should be rotated immediately:
   # sk-or-v1-[REDACTED_64_CHARS]
   ```

2. **Remove Sensitive Data from Git History**
   ```bash
   # Consider using BFG Repo-Cleaner to remove API keys from git history
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Set up Pre-commit Hooks**
   ```bash
   # Install pre-commit hooks to prevent future leaks
   npm install --save-dev @commitlint/cli @commitlint/config-conventional
   ```

### For Developers

1. **Update Local Environment**
   ```bash
   # Ensure .env is not in git
   git rm --cached .env
   
   # Create .env from example
   cp .env.example .env
   
   # Add your actual API keys to .env (never commit this file)
   ```

2. **Use Secure Logging**
   ```typescript
   // Instead of:
   console.log('API Key:', apiKey);
   
   // Use:
   import { secureLogger } from '../utils/secureLogger';
   secureLogger.logApiKeyValidation('OpenRouter', !!apiKey);
   ```

## 📚 Best Practices Going Forward

### 1. Environment Variables

✅ **DO:**
```bash
# Use environment variables
export OPENROUTER_API_KEY="your-actual-key"
node your-script.js
```

❌ **DON'T:**
```javascript
// Never hardcode API keys
const apiKey = "sk-or-v1-actual-key-here";
```

### 2. Logging Practices

✅ **DO:**
```typescript
import { secureLogger } from '../utils/secureLogger';

// Safe logging
secureLogger.info('API request completed successfully');
secureLogger.logApiKeyValidation('OpenRouter', true);
```

❌ **DON'T:**
```typescript
// Unsafe logging
console.log('API Key:', process.env.API_KEY);
console.log('Authorization header:', authHeader);
```

### 3. Documentation

✅ **DO:**
```markdown
# Use environment variable references
--key "$OPENROUTER_API_KEY"
```

❌ **DON'T:**
```markdown
# Never put real keys in docs
--key "sk-or-v1-actual-key-here"
```

### 4. Testing

✅ **DO:**
```typescript
// Use mock keys in tests
const mockApiKey = 'sk-test-1234567890abcdef';
```

❌ **DON'T:**
```typescript
// Never use real keys in tests
const apiKey = process.env.REAL_API_KEY;
```

## 🔍 Regular Security Checks

### 1. Run Security Scanner

```bash
# Run before every commit
node scripts/security-scan.js
```

### 2. Git Pre-commit Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# Run security scan before commit
node scripts/security-scan.js
if [ $? -ne 0 ]; then
    echo "❌ Security scan failed - commit aborted"
    exit 1
fi
```

### 3. Regular Audits

- Run security scan weekly
- Review environment files monthly
- Rotate API keys quarterly
- Check git history for leaks

## 📞 Incident Response

### If API Keys Are Exposed

1. **Immediate Actions** (within 1 hour):
   - Rotate all exposed keys
   - Revoke compromised keys
   - Remove keys from code/docs

2. **Short-term Actions** (within 24 hours):
   - Review git history for other exposures
   - Update all team members
   - Implement additional security measures

3. **Long-term Actions** (within 1 week):
   - Implement pre-commit hooks
   - Update security training
   - Review and update security policies

## 🛠️ Tools and Resources

### Security Tools
- **Security Scanner**: `scripts/security-scan.js`
- **Secure Logger**: `src/utils/secureLogger.ts`
- **BFG Repo-Cleaner**: For cleaning git history
- **GitLeaks**: For advanced secret scanning

### External Resources
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

## 📈 Security Metrics

Track these metrics to measure security posture:
- Number of security issues found per scan
- Time to fix critical security issues
- Percentage of code using secure logging
- Frequency of security training completion

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution and never commit sensitive data to version control.