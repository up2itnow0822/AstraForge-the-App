# AstraForge VS Code Extension
[![Build Status](https://github.com/up2itnow/AstraForge/workflows/CI/badge.svg)](https://github.com/up2itnow/AstraForge/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/up2itnow/AstraForge)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)](https://github.com/up2itnow/AstraForge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
AstraForge: Advanced VS Code extension for LLM-powered code collaboration, consensus building, and vector search in secure enterprise environments. Emphasizes modularity, consistency, and VS Code security standards.
## Features
- F-001: LLM Consensus Engine for multi-model code reviews
- F-002: Real-time Collaboration via WebSocket sessions
- F-003: Vector Search for code similarity detection
- F-004: Automated K8s Deployment Orchestration
- F-005: KPI Monitoring (latency, throughput, error rates)
- F-006: Comprehensive QA Pipelines (unit/integration/E2E)
- F-007: 100% JSDoc and OpenAPI Documentation
- F-008: CI/CD Integration with GitHub Actions
- F-009: Security Scanning (Snyk, CodeQL)
- F-010: Performance Optimization (caching/profiling)
- F-011: Accessibility Compliance (WCAG)
- F-012: Marketplace Deployment Support
- F-013: Monitoring Dashboards and Alerts
- F-014: Feature Flags and A/B Testing
- F-015: User Feedback and Iteration Loops
## Visuals
![Quickstart Demo](media/quickstart.gif) *Placeholder: Animated GIF showing installation, command palette activation, and LLM collab session in VS Code.*
![Extension Screenshot](.github/media/screenshot.png) *Placeholder: Static image of AstraForge sidebar with vector search results and consensus panel.*
## Quickstart
Install with one command:
```bash
code --install-extension astraforge.vsix
```
Alternatively, search 'AstraForge' in the VS Code Extensions marketplace.
## Installation
### Local Development
1. Clone the repository:
  ```bash
git clone https://github.com/up2itnow/AstraForge.git
cd AstraForge
```
2. Install dependencies:
  ```bash
npm install
```
3. Compile the extension:
  ```bash
npm run compile
```
4. Package the extension:
  ```bash
npm install -g @vscode/vsce  # If not installed
git checkout main  # Switch to main for stable
vsce package
```
5. Install locally:
  ```bash
code --install-extension astraforge-1.0.0.vsix
```
### Cloud (Marketplace)
- Open VS Code > Extensions view (Ctrl+Shift+X)
- Search for "AstraForge"
- Click Install
## Usage
- **Commands**: Open Command Palette (Ctrl+Shift+P) and run:
 - `AstraForge: Start Consensus Review` – Select code, prompt LLMs for consensus.
 - `AstraForge: Collaborate on File` – Generate session ID for real-time edits.
 - `AstraForge: Vector Search` – Query "Find similar functions" in active workspace.
- **Sidebar Integration**: Use AstraForge panel for ongoing prompts like "Optimize this for security".
- **Monitoring**: `AstraForge: View KPIs` to see session metrics.
For advanced configuration, see [./docs/](./docs/). Contributions welcome – see [CONTRIBUTING.md](./CONTRIBUTING.md).