# AstraForge IDE Changelog

All notable changes to the AstraForge IDE extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-10-01

### ✨ Features
- Integrated the Spec Kit pipeline into the workflow manager to auto-generate specifications, plans, and executable task lists before the adaptive workflow begins.
- Added automated Spec Kit task execution with vector storage of results, providing richer context for subsequent development phases.
- Enhanced the API Tester webview with secret storage, environment-aware provider/model defaults, batch key validation, and a 3-LLM conference simulator with budget controls.
- Expanded the API Tester core with token/cost estimation, real API key validation calls, conference simulations, and richer telemetry for every request.
- Updated the CLI tooling to reuse the ApiTesterCore, enabling single, batch, workflow, conference, and vector tests from the command line.

### 🐛 Bug Fixes
- Improved resilience of spec-driven workflows by catching initialization failures and surfacing informative status messages instead of halting the main workflow.
- Added graceful handling for conference budget/timeout limits to avoid runaway simulations.

### ♻️ Code Refactoring
- Centralized LLM panel management with runtime overrides, environment-driven defaults, and reusable panel setters for tests and tooling.
- Simplified provider initialization with reset-aware logic so panel updates instantly refresh the underlying providers.

### 📚 Documentation
- Rebuilt the changelog to remove merge conflicts and document the v3 release alongside prior milestones.

### 🧪 Tests
- Extended test surfaces via the improved ApiTesterCore to cover conference and batch scenarios with richer diagnostics.

### 🔧 Maintenance
- Modernized the API tester web assets and command-line tooling to align with the new Spec Kit workflow and environment mapping defaults.

## [2.0.0] - 2025-09-22

### Highlights
- Complete self-evolving AI ecosystem featuring inter-agent evolution, quantum-inspired decision making, and meta-learning.
- Emergent behavior detection, recursive self-modification, and advanced multi-agent LLM collaboration.
- Comprehensive testing suite with property-based, load, and security testing; extensive analytics and enterprise security hardening.

## [1.0.0] - 2025-01-10

### Highlights
- Initial release with basic multi-LLM support, vector database integration, workflow management, and Git automation.
- Provided project initialization features and foundational testing infrastructure.
