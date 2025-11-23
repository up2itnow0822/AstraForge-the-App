---

# **AstraForge Studio V3 — Engineering Quick-Start**

**Purpose:**  
 This is the *minimum you need to know* as an engineer to work on AstraForge Studio V3’s codebase, architecture, and agentic workflows.

---

## **1\. System Summary**

AstraForge Studio V3 is a standalone Electron-based IDE that autonomously builds **100% of an application**, ensures **100% of tests pass**, and self-improves through the **Recursive Self-Improvement (RSI)** framework.

Main components:

* **Electron Desktop App** (UI \+ shell)

* **React UI \+ Monaco Editor**

* **Local Orchestration Engine** (Node/Express)

* **AstraForge Cloud** (multi-agent \+ quantum routing)

* **LanceDB** for vector storage (local \+ cloud)

---

## **2\. Local Architecture Diagram (High-level)**

`Electron App`  
 `├─ Renderer (React + Monaco)`  
 `├─ Preload (secure bridge)`  
 `└─ Main Process`  
      `├─ Local Orchestration Engine (Node)`  
      `│    ├─ Agent Router`  
      `│    ├─ Test Runner`  
      `│    ├─ RSI Loop Manager`  
      `│    ├─ Decision Engine`  
      `│    └─ Local LanceDB`  
      `└─ Cloud Integration Layer`

---

## **3\. Setup Instructions**

### **Prerequisites**

* Node 18+

* PNPM or Yarn

* Rust (for LanceDB dependencies)

* GitHub token with repo access

* Mac/Win/Linux (Electron supported)

### **Install**

`pnpm install`  
`pnpm run dev`

### **Build Desktop App**

`pnpm run build`  
`pnpm run electron:build`

---

## **4\. Key Systems You Will Touch**

### **Frontend (Renderer)**

* React components

* Monaco editor extensions

* Pretty Theme Engine

* Voice command integrations

* Agent Decision Panel UI

### **Backend (Local Engine)**

* Agent router (decisions: which agents to call when)

* Test runner integration

* Diff application \+ AST utilities

* RSI loop (EvoLoop phases 1–5)

* Cloud API client bindings

### **Cloud Integration**

* Multi-agent pipelines

* Large context ingestion

* Quantum routing

* Long-running jobs

---

## **5\. Engineering Rules-of-Thumb**

* **Never directly call LLMs in UI** → always go through Local Orchestration Engine

* **All code writes must go through diff-application utilities**

* **Never block the UI**; orchestration runs async in background

* **All agent actions must be logged** (telemetry \+ RSI scoring)

* **All test results must flow through Test Runner → Test Panel**

---

## **6\. Testing**

* Unit tests run via **Jest/Vitest**

* E2E tests run via **Playwright**

* Always ensure:

  * Test runner is repeatable

  * All diffs apply atomically

  * Test execution integrates with local engine event bus

---

## **7\. Done Criteria for Engineers**

* UI rendering \< 33ms per frame

* Test suite fully integrated

* Builds 100% of modules for sample templates

* RSI cycle runs per project

* Electron installer builds cleanly

* No renderer → main process security violations

---

## **8\. Where to Start**

1. **/app/ui** → Editor \+ Panels

2. **/core/orchestration** → Router \+ RSI \+ Test Runner

3. **/cloud** → Agent API bindings

Start with:  
 `LocalOrchestrationEngine.ts`  
 `AgentRouter.ts`  
 `DecisionEngine.ts`

---

# **End of Quick-Start**

---

---

