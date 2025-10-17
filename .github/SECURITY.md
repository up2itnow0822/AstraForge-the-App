# Security Policy
## Supported Versions
AstraForge follows semantic versioning. Only the latest release in each major version is officially supported with security updates.
| Version | Supported          |
|---------|---------------------|
| 1.x    | ✅ Yes             |
| 0.x    | ❌ No (legacy)     |
## Security Requirements
The extension adheres to [VS Code Extension Security Guidelines](https://code.visualstudio.com/api/advanced-topics/extension-guidelines#security). Key measures:
- `trustedCodeActions: false` (no unsafe code execution).
- No use of `eval()` or dynamic code execution.
- Input validation and sanitization for user prompts/LLM outputs.
- Secure communication (WebSocket over TLS, API calls with auth).
## Reporting a Vulnerability
We take security seriously and appreciate your efforts to disclose vulnerabilities responsibly.
### How to Report
1. **Email**: Send details to security@up2itnow.com (preferred for sensitive issues).
2. **GitHub Issue**: Create a private issue or use the [private vulnerability reporting](https://github.com/up2itnow/AstraForge/security/advisories/new) (if enabled).
3. **PGP Key**: Optional encryption. Public key available upon request.
Include:
- Description of the vulnerability.
- Steps to reproduce.
- Impact assessment.
- Proposed fix (optional).
### Disclosure Policy
- **Acknowledgment**: We'll confirm receipt within 48 hours.
- **Assessment**: Triage and reproduce within 7 days.
- **Resolution**: Patch and release within 90 days for critical issues.
- **Coordinated Disclosure**: No public disclosure until fix is available (90-day coordination, extendable for complex cases).
- **Credit**: Contributors credited in release notes/CHANGELOG unless anonymity requested.
## Vulnerability Management
- **Code Scanning**: GitHub CodeQL and Snyk integrated in CI (see .github/workflows/security.yml).
- **Dependabot**: Enabled for npm dependencies (weekly updates, auto-PRs).
- **Alerts**: Security alerts enabled; reviewed weekly.
- **Bounty**: No formal program, but significant contributions eligible for recognition.
For more, see [GitHub Security](https://docs.github.com/en/code-security).
Thanks for helping keep AstraForge secure!