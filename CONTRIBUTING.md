# Contributing to AstraForge

Thank you for your interest in AstraForge — the Sovereign AI IDE with 5-agent consensus! Contributions are welcome and appreciated.

## Table of Contents

1. [Development Setup](#1-development-setup)
2. [Project Structure](#2-project-structure)
3. [Adding a New LLM Provider](#3-adding-a-new-llm-provider)
4. [Running Tests](#4-running-tests)
5. [Code Style](#5-code-style)
6. [Submitting a Pull Request](#6-submitting-a-pull-request)

---

## 1. Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Git | any recent |
| (Optional) Ollama | any | — for local LLM testing |

### Clone & install

```bash
git clone https://github.com/up2itnow0822/AstraForge-the-App.git
cd AstraForge-the-App
npm install
```

> **Note:** `node-pty` requires native compilation. If `npm install` fails on the pty step,
> install platform build tools:
> - **macOS:** `xcode-select --install`
> - **Linux:** `sudo apt install build-essential python3`
> - **Windows:** `npm install --global windows-build-tools`

### Environment variables

```bash
cp example.env .env   # or create .env from scratch
```

Minimum `.env` for a working local run with Ollama:

```env
OLLAMA_ENDPOINT=http://127.0.0.1:11434
OLLAMA_MODEL=llama3
```

Cloud keys are optional; the app falls back gracefully.

### Start development

```bash
npm run dev        # Vite (port 5173) + Electron, hot-reload
```

Alternatively, for server/web-only mode (no Electron):

```bash
# Terminal 1 — backend
node src/server.js   # or: npx ts-node src/server.ts

# Terminal 2 — frontend
npm run dev:vite
```

### Production build

```bash
npm run build      # Vite renderer + Electron main (tsc)
npm run dist       # Creates distributable in release/
```

---

## 2. Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # App lifecycle, IPC handlers, PTY sessions
│   └── preload.ts           # Context bridge — exposes window.astraAPI
│
├── renderer/                # React frontend (compiled by Vite)
│   ├── api/
│   │   └── bridge.ts        # Isomorphic API: IPC in Electron, Socket.io in web
│   ├── components/
│   │   ├── XTerminal.tsx    # Integrated terminal (IPC mode + Socket.io mode)
│   │   └── ...
│   └── types/
│       └── global.d.ts      # window.astraAPI type definitions
│
├── core/                    # Business logic (shared)
│   ├── agents/
│   │   └── LLMAgent.ts      # Multi-provider LLM agent
│   ├── config/
│   │   └── AgentConfig.ts   # AGENT_ROSTER + API key store
│   └── orchestration/
│       └── LocalOrchestrationEngine.ts  # Debate engine
│
└── ...                      # Other subsystems (testing, vector-db, etc.)
```

---

## 3. Adding a New LLM Provider

AstraForge ships with providers for OpenAI, Anthropic, OpenRouter, Grok, Ollama, and LM-Studio. Adding a new one takes three steps.

### Step 1 — Wire up the API call in `LLMAgent.ts`

Open `src/core/agents/LLMAgent.ts` and find the `callProvider()` method (or equivalent switch/if block). Add a new case:

```typescript
case 'myprovider': {
  const response = await fetch('https://api.myprovider.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: this.config.model,
      messages,
      max_tokens: 4096,
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content as string;
}
```

### Step 2 — Register the env-var key in `AgentConfig.ts`

Open `src/core/config/AgentConfig.ts` and add the provider to `PROVIDER_KEY_MAP` (or the equivalent constant):

```typescript
myprovider: process.env.MYPROVIDER_API_KEY ?? '',
```

### Step 3 — Handle the provider in `main.ts`

Open `src/main/main.ts` and add detection logic inside `app.whenReady()`:

```typescript
const myProviderKey = AgentConfig.getApiKey('myprovider');

// Then inside AGENT_ROSTER.forEach(...):
if (myProviderKey) {
  provider = 'MyProvider';
  apiKey = myProviderKey;
  model = 'myprovider-v1'; // default model
}
```

### Step 4 — (Optional) Surface it in the Settings UI

If you want users to configure the key via the Settings modal, add it to the provider list in `src/renderer/components/SettingsModal.tsx`.

### Step 5 — Add a test

Create `src/core/agents/__tests__/LLMAgent.myprovider.test.ts`:

```typescript
import { LLMAgent } from '../LLMAgent';

describe('LLMAgent – MyProvider', () => {
  it('formats the request correctly', async () => {
    // Mock fetch, instantiate LLMAgent with provider='myprovider', assert output
  });
});
```

---

## 4. Running Tests

```bash
# Run all tests (188 tests, 57 suites)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type-check without emitting
npm run typecheck
```

Tests use **Jest + ts-jest**. All test files live in `src/**/__tests__/` next to the code they test.

**Important:** the test suite must stay at 188 passing tests before any PR is merged.

---

## 5. Code Style

- **TypeScript strict mode** — all new code must pass `npm run typecheck` with zero errors.
- **ESLint** — run `npm run lint` before committing; auto-fix with `npm run lint:fix`.
- **No `any`** in new code unless genuinely unavoidable — use `unknown` + type guards.
- **Context isolation:** The preload script (`preload.ts`) must **never** import Node.js APIs directly into the renderer. Always use the IPC bridge.

---

## 6. Submitting a Pull Request

1. **Fork** the repo and create a feature branch:
   ```bash
   git checkout -b feat/my-new-provider
   ```

2. Make your changes and ensure:
   ```bash
   npm run typecheck   # 0 errors
   npm run lint        # 0 warnings (ideally)
   npm test            # 188 tests pass
   npm run build       # clean build
   ```

3. **Commit** with a clear message:
   ```
   feat(providers): add MyProvider LLM integration
   ```

4. Push and open a **Pull Request** against `main`.

5. Describe in the PR:
   - What problem you're solving
   - How you tested it
   - Any breaking changes

---

## Questions?

Open a [GitHub Issue](https://github.com/up2itnow0822/AstraForge-the-App/issues) — we're happy to help!
