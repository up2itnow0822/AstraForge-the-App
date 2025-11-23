---

# **AstraForge Studio V3 — Repository Folder Structure Blueprint**  ---

#  **Repository Folder Structure Blueprint**

**File Name:** `AstraForge_Repo_Structure.md`

---

# **AstraForge Studio V3 — Repository Folder Structure Blueprint**

This is the standardized filesystem layout for the entire codebase.

---

# **1\. Root Structure**

/astraForge  
 ├─ /app  
 ├─ /core  
 ├─ /cloud  
 ├─ /agents  
 ├─ /themes  
 ├─ /tests  
 ├─ /docs  
 ├─ /scripts  
 ├─ package.json  
 ├─ electron-main.js  
 └─ README.md

---

# **2\. Directory Breakdown**

## **2.1 /app (Frontend)**

/app  
 ├─ /ui  
 │   ├─ /components  
 │   ├─ /layouts  
 │   ├─ /panels  
 │   │    ├─ AgentPanel/  
 │   │    ├─ TestPanel/  
 │   │    ├─ LogPanel/  
 │   │    └─ SpecPanel/  
 │   ├─ /hooks  
 │   ├─ /services  
 │   └─ /styles  
 ├─ /editor  
 │   ├─ Monaco integration  
 │   ├─ inline chat  
 │   ├─ diff engine  
 │   └─ multi-pane layout  
 ├─ /voice  
 └─ index.tsx

---

## **2.2 /core (Local Orchestration Engine)**

/core  
 ├─ /orchestration  
 │   ├─ LocalOrchestrationEngine.ts  
 │   ├─ AgentRouter.ts  
 │   ├─ RSIManager.ts  
 │   ├─ DecisionEngine.ts  
 │   ├─ TestRunnerBridge.ts  
 │   ├─ DiffEngine.ts  
 │   ├─ FSAdapter.ts  
 │   └─ MetricsCollector.ts  
 ├─ /state  
 │   ├─ WorkspaceState.ts  
 │   ├─ ProjectGraph.ts  
 │   └─ ModuleRegistry.ts  
 └─ /vector  
     ├─ LanceDBLocal.ts  
     └─ EmbeddingUtils.ts

---

## **2.3 /cloud (API Integrations)**

/cloud  
 ├─ CloudClient.ts  
 ├─ MultiAgentAPI.ts  
 ├─ QuantumRouter.ts  
 ├─ CloudVectorStore.ts  
 └─ JobPoller.ts

---

## **2.4 /agents (Agent Schemas \+ Prompts)**

/agents  
 ├─ SpecAgent/  
 ├─ ArchAgent/  
 ├─ BackendAgent/  
 ├─ FrontendAgent/  
 ├─ TestAgent/  
 ├─ SecurityAgent/  
 ├─ PerformanceAgent/  
 ├─ DocsAgent/  
 ├─ JudgeAgent/  
 └─ GödelAgent/   (RSI core)

---

## **2.5 /themes (Pretty Theme Engine)**

/themes  
 ├─ /presets  
 │   ├─ PrettyDark.json  
 │   ├─ PrettyLight.json  
 │   ├─ PrettySolar.json  
 │   └─ PrettyNeon.json  
 ├─ /editor-tokens  
 │   ├─ semantic-tokens.json  
 │   └─ diagnostic-colors.json  
 └─ ThemeEngine.ts

---

## **2.6 /tests**

/tests  
 ├─ unit/  
 ├─ integration/  
 ├─ e2e/  
 ├─ fixtures/  
 └─ test-config/

---

## **2.7 /docs**

/docs  
 ├─ Technical\_Spec.md  
 ├─ Engineering\_QuickStart.md  
 ├─ UML\_Diagrams.md  
 ├─ RSI\_Whitepaper.md  
 └─ API/

---

## **2.8 /scripts**

/scripts  
 ├─ build.ts  
 ├─ release.ts  
 ├─ clean.ts  
 ├─ test-all.sh  
 └─ verify-env.ts

---

# **End of Repository Structure Blueprint**

---

