# Revised Technical Specifications: AstraForge Standalone (v1.0.0 Target)

## 1. System Overview
AstraForge is a **Standalone Desktop Application** (Electron) designed as a comprehensive Multi-Agent Development Environment. It operates independently of VS Code, providing a dedicated workspace for autonomous coding, architectural simulation, and quantum-enhanced logic processing.

## 2. Core Architecture
*   **Platform:** Electron (Chromium + Node.js)
*   **Frontend:** React (Single Page Application)
*   **Backend:** Node.js (Electron Main Process)
*   **Language:** TypeScript (Strict Mode enforced)
*   **Orchestration:** LocalOrchestrationEngine (Preserved Core Logic)
    *   *Role:* Manages the lifecycle and communication of the 5-Agent Panel.
    *   *Context:* Migrated from Extension Host to Electron Main Process.
*   **Data Persistence:**
    *   **Metadata:** SQLite (replacing VS Code Memento)
    *   **Vector Memory:** LanceDB (Local Semantic Store)

## 3. Agent Protocols (Immutable)
*   **The Panel:** A fixed set of 5 Specialized Agents (Architect, Developer, Tester, Reviewer, Planner).
*   **Consensus:** 'Confer and Debate' protocol over internal message bus.
*   **Self-Correction:** RSI (Recursive Self-Improvement) loop analyzing internal tool definitions.

## 4. Key Functional Requirements
*   **Quantum Logic:** Probabilistic agent selection algorithms.
*   **Isolation:** Agents run in sandboxed child processes or worker threads to prevent UI freezing.
*   **Security:** Context Isolation enabled in Electron; IPC (Inter-Process Communication) strictly typed.

## 5. Development Standards
*   **Linting:** Zero-tolerance policy for any types.
*   **Testing:** Jest for unit tests; Playwright/Spectron for E2E Electron testing.
