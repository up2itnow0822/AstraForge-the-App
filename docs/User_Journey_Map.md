# AstraForge IDE: User Journey Map

**Document Version:** 1.0  
**Target Audience:** New Users, Architects, and Evaluators  

---

## Introduction

AstraForge is not just another text editor; it is an **Autonomous Development Council**. This document outlines the journey of a developer interacting with the AstraForge system, illustrating how the 5-Agent Consensus Engine transforms a simple prompt into robust, production-grade software.

---

## The Journey

### Step 1: Setup & Launch
**The Encounter:**
After downloading the AstraForge binary (`.AppImage`, `.exe`, or `.dmg`),
the user launches the application. There is no complex configuration or Docker requirement—it is a standalone, native desktop application.

**The Visuals:**
*   **The Look:** A sleek, familiar Dark Mode interface reminiscent of VS Code.
*   **The Layout:** 
    *   **Left:** A navigation Sidebar.
    *   **Center:** The powerful **Monaco Editor** (currently empty) and a `Development Objective` input bar.
    *   **Right:** The **Agent Panel**, currently showing 5 specialized agents in an `IDLE` state.
    *   **Bottom:** An integrated **Terminal** console ready for system logs.

### Step 2: Ignition
The user enters the environment. The system is quiet. The "Agent Sync" lights on the right panel are dim gray.

### Step 3: The Prompt
The user has a complex request. Instead of asking for a snippet, they define a goal.

*   **Input:** *"Create a secure, scalable authentication API handling high concurrency, with JWT and automated anomaly detection."*
*   **Action:** User clicks **Start Debate**.

### Step 4: The Council (The 5-Agent Debate)
This is the defining moment of AstraForge. The system does not immediately write code. It **thinks**.

**The Visualization:**
On the right-hand **Agent Panel**, the status indicators come alive. 

1.  **Nexus (Orchestrator)** lights up `SPEAKING` (Green Pulse).
    *   *Log:* "Analyzing request... Proposing Microservices Architecture with Redis caching."
2.  **Vanguard (Security)** interrupts, status shifts to `THINKING` (Blue Pulse) then `SPEAKING`.
    *   *Log:* "Critique: Standard JWT storage is vulnerable. Mandating HttpOnly cookies and CSRF protection."
3.  **Prism (Product)** weighs in.
    *   *Log:* "Wait. The anomaly detection features must not impede user login speed. We need a non-blocking async queue."
4.  **Helix (AI Systems)** activates.
    *   *Log:* "Proposing an Isolation Forest model for the anomaly detection module. I will draft the Python inference service."
5.  **Cipher (Impl. Architect)** finalizes.
    *   *Log:* "Agreed. I will enforce strict TypeScript interfaces for all payloads. Proceeding to implementation."

**The User Experience:**
The user watches this consensus form in real-time via the streaming logs. They aren't just getting code; they are witnessing an architectural review.

### Step 5: Execution
Once consensus is reached:

*   **The Editor:** Code begins to stream into the Monaco Editor in the center pane.
*   **The Agents:** All agents settle into `IDLE` or monitor specific parts of the generation.
*   **The Result:** A complete file structure is generated, not just a snippet. The terminal confirms: `Task Complete: Consensus Achieved`.

---

## The Technical Edge

Why use AstraForge over a standard AI Chatbot?

| Feature | Standard AI Chatbot | AstraForge 5-Agent Council |
| :--- | :--- | :--- |
| **Perspective** | Singular, often hallucinates confidence. | **Multi-faceted**. Security fights functionality; Architecture fights Speed. |
| **Self-Correction** | Requires user to prompt "You missed a bug". | **Internal**. Vanguard catches Nexus's mistakes before the user sees them. |
| **Domain Logic** | Generalist. | **Specialized**. Helix knows things regarding AI vectors that Cipher (pure coder) might not prioritize. |
| **Execution** | Chat text. | **Native IPC**. Direct integration with the file system and editor. |

