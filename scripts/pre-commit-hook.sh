#!/bin/bash
# Pre-commit hook to prevent API key leaks
# Install this hook by copying to .git/hooks/pre-commit and making it executable

echo "🔍 Running security checks before commit..."

# Run the security scanner
node scripts/security-scan.js --staged-only

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: Security issues found!"
    echo ""
    echo "🔧 To fix:"
    echo "1. Remove any hardcoded API keys"
    echo "2. Use environment variables instead"
    echo "3. Run: node scripts/security-scan.js"
    echo ""
    echo "⚠️  If you believe this is a false positive, please review the output carefully."
    echo "   You can bypass this check with: git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ Security checks passed!"
exit 0