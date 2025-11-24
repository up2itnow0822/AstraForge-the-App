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
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
![Quickstart Demo](media/quickstart.gif) *Placeholder: Animated GIF showing installation, command palette activation, and LLM collab session in VS Code.*
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
![Extension Screenshot](.github/media/screenshot.png) *Placeholder: Static image of AstraForge sidebar with vector search results and consensus panel.*
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
## Quickstart
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
Install with one command:
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
```bash
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
code --install-extension astraforge.vsix
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
```
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
Alternatively, search 'AstraForge' in the VS Code Extensions marketplace.
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
## Installation
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
### Local Development
## Badges
[![Dependabot](https://github.com/up2itnow/AstraForge/actions/workflows/dependabot.yml/badge.svg)]
[![Snyk](https://snyk.io/test/github/up2itnow/AstraForge/badge.svg)]
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
## 📦 installation & Release

### Build Artifacts
The application has been packaged for production. You can find the installers in the `release/` directory.

### How to Install

**Linux**
1. Locate `release/AstraForge IDE-0.5.0-arm64.AppImage`
2. Make it executable: `chmod +x AstraForge\ IDE-0.5.0-arm64.AppImage`
3. Run: `./AstraForge\ IDE-0.5.0-arm64.AppImage`

**Windows (NSIS)**
* Run the `Setup.exe` generated in the release folder.

**macOS (DMG)**
* Open the `.dmg` file and drag the application to your generic Applications folder.

### Development Build
To rebuild the application from source:
```bash
npm install
npm run dist
```

## 🐳 Docker Support

AstraForge can run in a headless Docker environment using the Web Adaptor.

### Build & Run
```bash
docker build -t astraforge-web .
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here astraforge-web
```
Open specific in browser: `http://localhost:3000`

## ⚙️ Settings & Configuration
*   **Desktop:** Click the Settings (Gear) icon in the sidebar to manage API Keys.
*   **Docker:** Pass keys as ENV variables or configure via the UI (stored in ephemeral session).

## Credits
This architectural pattern of multi-agent orchestration and providing a direct settings UI is inspired by the **agent-zero** framework.

## 🐳 Docker Support

AstraForge can be run in a containerized web-server mode using Docker. This allows for headless deployment or cloud hosting.

### Build & Run
```bash
# Build the image
docker build -t astraforge-ide .

# Run the container (Access at http://localhost:3000)
docker run -p 3000:3000 -e OPENAI_API_KEY="your-key" astraforge-ide
```

## ⚖️ Credits & Attribution

*   **Agent Architecture**: Inspired by the Multi-Agent framework patterns.
*   **Settings UI**: The settings interface and structural concepts are adapted from the **[agent-zero](https://github.com/agent0ai/agent-zero)** project. We acknowledge their innovation in agentic UI design.
