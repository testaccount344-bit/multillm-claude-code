# MultiLLM Claude Code

<p align="center">
  <strong>Full Claude Code TUI — with any LLM provider.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#connect-command">Connect Command</a> •
  <a href="#supported-providers">Providers</a> •
  <a href="#architecture">Architecture</a>
</p>

> **Origin**: This project is based on the Claude Code source code that leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). This fork adds multi-provider support via the `/connect` command, Windows compatibility fixes, and additional bug fixes.

---

## What Is This?

A **locally runnable version** repaired from the leaked Claude Code source, now with support for **75+ LLM providers** — OpenAI, Anthropic, Google, DeepSeek, Groq, OpenRouter, GitHub Copilot, and many more.

The original leaked source does not run as-is. This repository fixes multiple blocking issues and adds a `/connect` command that lets you pick any provider and enter API keys directly from the TUI — no `.env` file needed.

---

## Features

- **Full Ink TUI** — pixel-perfect recreation of the official Claude Code terminal interface
- **`/connect` command** — pick from 75+ providers and enter API keys interactively, just like OpenCode
- **Multi-provider support** — Anthropic, OpenAI (incl. ChatGPT Codex OAuth), Google, DeepSeek, Groq, xAI, OpenRouter, GitHub Copilot, GitLab Duo, Ollama, and 60+ more
- **Headless mode** — `--print` for scripts and CI pipelines
- **MCP server, plugin, and Skills support**
- **Custom API endpoints and model mappings**
- **Fallback Recovery CLI** for when the TUI has issues
- **Windows compatibility** — runs on PowerShell, cmd, and Git Bash

---

## Quick Start

### 1. Install Bun

This project requires [Bun](https://bun.sh).

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# npm (cross-platform)
npm install -g bun
```

Verify:
```bash
bun --version
```

### 2. Clone & Install

```bash
git clone https://github.com/testaccount344-bit/multillm-claude-code.git
cd multillm-claude-code
bun install
```

### 3. Start

```bash
# macOS / Linux
./bin/claude-haha

# Windows — PowerShell / cmd (recommended)
bun --env-file=.env ./src/entrypoints/cli.tsx

# Windows — Git Bash
./bin/claude-haha
```

> **No API key needed to start.** Once the TUI is running, type `/connect` to add your provider and API key.

### 4. Connect Your Provider

Inside the TUI, type:

```
/connect
```

You'll see a searchable provider picker. Select your provider → enter your API key → done. Your credentials are saved for future sessions.

---

## Connect Command

The `/connect` command lets you configure any LLM provider without touching config files.

### Step 1 — Provider Picker

Fuzzy-search through 75+ providers. Arrow keys to navigate, Enter to select, Esc to cancel.

```
┌ Connect to a Provider
│ Type to search…
│ > Anthropic — Claude Haiku, Sonnet, Opus
│   OpenAI — GPT-4, GPT-5, o-series, Codex
│   OpenRouter — 100+ models, one key
│   DeepSeek — DeepSeek Reasoner & chat
│   Groq — Ultra-fast Llama, Mixtral
│   ...
│
│ ↑/↓ navigate · Enter select · Esc cancel
```

### Step 2 — Auth Method (if applicable)

Some providers offer multiple auth methods. For example, OpenAI gives you:
- **API Key** — paste your `sk-proj-...` key
- **ChatGPT Codex (OAuth)** — sign in with your ChatGPT account (opens browser automatically)

```
┌ OpenAI — Select auth method
│ > API Key
│   ChatGPT Codex (OAuth)
│
│ ↑/↓ navigate · Enter select · Esc cancel
```

### Step 3 — Enter Credentials

Each required field gets its own screen. Secrets are masked with `*`. Optional fields can be skipped.

```
┌ Connect to a Provider
│   Step 1 of 2
│
│   API Key
│   > sk-ant-█████████████
│
│   Enter to confirm · Esc to skip · Ctrl+C to cancel
```

For OAuth providers like ChatGPT Codex, your browser opens automatically and you paste the auth code shown:

```
┌ Connect to OpenAI
│ Opening your browser for authentication...
│ > https://chatgpt.com/codex
│
│ Enter the authorization code shown:
│ > █
│
│ Enter to confirm · Ctrl+C to cancel
```

Credentials are saved to `~/.claude.json` under the `env` section — they persist across sessions.

---

## Supported Providers

### Popular
| Provider | Description | Auth |
|---|---|---|
| **Anthropic** | Claude Haiku, Sonnet, Opus | API Key |
| **OpenAI** | GPT-4, GPT-5, o-series, Codex | API Key / OAuth |
| **Google Vertex AI** | Gemini via Google Cloud | Service Account |
| **OpenRouter** | 100+ models, one key | API Key |
| **DeepSeek** | DeepSeek Reasoner & chat | API Key |
| **Groq** | Ultra-fast Llama, Mixtral | API Key |
| **xAI (Grok)** | Grok models | API Key |
| **Cohere** | Command, Aya models | API Key |
| **Mistral AI** | Mistral Large, Codestral | API Key |

### Subscriptions
| Provider | Description | Auth |
|---|---|---|
| **GitHub Copilot** | Use your Copilot subscription | Device Code |
| **GitLab Duo** | Claude via GitLab Agent Platform | OAuth / PAT |

### Open Source / Local
| Provider | Description | Auth |
|---|---|---|
| **Ollama** | Local models on your machine | None |
| **Ollama Cloud** | Managed Ollama inference | API Key |
| **LM Studio** | Local models via LM Studio | None |
| **llama.cpp** | Local models via llama-server | None |
| **Hugging Face** | Open models via Inference Providers | API Token |

### Inference Platforms
| Provider | Description |
|---|---|
| **Together AI** | Open source models at scale |
| **Fireworks AI** | Fast inference for open models |
| **Cerebras** | Lightning-fast WSE-3 inference |
| **Deep Infra** | Affordable open model inference |
| **Baseten** | GPU-optimized inference |
| **Moonshot AI** | Kimi K2 models |
| **MiniMax** | M2.1 and other models |
| **IO.NET** | Decentralized GPU inference |
| **Cortecs** | GPU cloud for AI |
| **Firmware** | AI inference platform |
| **Nebius** | GPU cloud with AI services |
| **Venice AI** | Privacy-focused inference |
| **Z.AI** | GLM models from Zhipu AI |
| **302.AI** | Multi-model API gateway |

### Gateways
| Provider | Description |
|---|---|
| **Cloudflare AI Gateway** | Unified gateway with caching |
| **Cloudflare Workers AI** | Edge network inference |
| **Helicone** | Observability + caching |
| **Vercel AI Gateway** | AI gateway with analytics |

### Cloud
| Provider | Description |
|---|---|
| **Amazon Bedrock** | AWS managed AI service |
| **Azure OpenAI** | OpenAI via Microsoft Azure |
| **Azure Cognitive Services** | OpenAI via Azure Cognitive |
| **Google AI Studio** | Gemini via AI Studio |
| **Scaleway** | European cloud AI |
| **OVHcloud** | European AI endpoints |
| **STACKIT** | European sovereign AI |

### Enterprise
| Provider | Description |
|---|---|
| **SAP AI Core** | SAP Business Technology Platform |

---

## Environment Variables

You can also configure providers via `.env` file (copy from `.env.example`):

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | One of two | API key via `x-api-key` header |
| `ANTHROPIC_AUTH_TOKEN` | One of two | Auth token via `Authorization: Bearer` |
| `ANTHROPIC_BASE_URL` | No | Custom API endpoint |
| `ANTHROPIC_MODEL` | No | Default model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | No | Sonnet-tier model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | No | Haiku-tier model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | No | Opus-tier model |
| `API_TIMEOUT_MS` | No | API timeout (default: 600000) |
| `DISABLE_TELEMETRY` | No | Set to `1` to disable telemetry |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | No | Set to `1` to disable non-essential traffic |

---

## Platform-Specific Instructions

### macOS / Linux

```bash
./bin/claude-haha              # Interactive TUI
./bin/claude-haha -p "prompt"  # Headless mode
```

### Windows

**Prerequisite**: [Git for Windows](https://git-scm.com/download/win) must be installed.

**Option 1 — PowerShell / cmd (recommended):**
```powershell
bun --env-file=.env ./src/entrypoints/cli.tsx
```

**Option 2 — Git Bash:**
```bash
./bin/claude-haha
```

> **Note**: Some features (voice input, Computer Use, sandbox isolation) are not available on Windows. Core TUI interaction works fully.

### Fallback Mode

If the full TUI has issues, use the simplified recovery CLI:

```bash
# macOS / Linux
CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claude-haha

# Windows
$env:CLAUDE_CODE_FORCE_RECOVERY_CLI=1; bun --env-file=.env ./src/localRecoveryCli.ts
```

---

## Architecture

The project follows a layered architecture:

```
┌─────────────────────────────────────────────────┐
│              Terminal UI (Ink + React)           │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   REPL     │  │ Messages │  │  Components  │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
├─────────────────────────────────────────────────┤
│              Command & Tool Layer                │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ /connect  │  │ /models  │  │  Bash/Edit   │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
├─────────────────────────────────────────────────┤
│              Service Layer                       │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   API     │  │   MCP    │  │  Settings    │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
├─────────────────────────────────────────────────┤
│              Infrastructure                      │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Bun     │  │  Config  │  │  Telemetry   │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

Key subsystems:
- **Overall architecture** — Full stack from terminal to API
- **Request lifecycle** — Prompt → tool calls → response → render
- **Tool system** — Bash, Edit, Grep, WebFetch, and more
- **Multi-agent** — Sub-agents, coordinators, and swarm mode
- **Permissions** — YOLO, accept-edit, auto, and manual modes
- **Services layer** — API, MCP, OAuth, telemetry
- **State and data flow** — Message queue, session storage, config

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript |
| Terminal UI | React + [Ink](https://github.com/vadimdemedes/ink) |
| CLI parsing | Commander.js |
| API | Anthropic SDK |
| Protocols | MCP, LSP |

---

## Project Structure

```
bin/claude-haha          # Entry script
.env.example             # Environment variable template
src/
├── entrypoints/cli.tsx  # Main CLI entry
├── main.tsx             # Main TUI logic
├── screens/REPL.tsx     # Interactive REPL screen
├── commands/            # Slash commands (/connect, /commit, etc.)
│   └── connect/         # Multi-provider connection command
│       ├── index.ts     # Command registration
│       ├── connect.tsx  # UI: picker → auth → key entry
│       └── providers.ts # 75+ provider definitions
├── components/          # UI components
├── tools/               # Agent tools (Bash, Edit, Grep, etc.)
├── services/            # Service layer (API, MCP, OAuth, etc.)
├── hooks/               # React hooks
└── utils/               # Utility functions
```

---

## Fixes Applied

| Issue | Root Cause | Fix |
|---|---|---|
| TUI does not start | Entry script routed to recovery CLI | Restored full `cli.tsx` entry |
| Startup hangs | Missing `.md` files cause Bun text loader to hang | Added stub files |
| Enter key does nothing | `modifiers-napi` native package throws on Windows | Added try/catch fault tolerance |
| Setup skipped | `preload.ts` auto-set `LOCAL_RECOVERY=1` | Removed default setting |
| `bun:bundle` stack overflow on Windows | Bun compiler builtin broken on Windows | Polyfill + canary Bun workaround |
| No multi-provider support | Hardcoded to Anthropic only | Added `/connect` command with 75+ providers |

---

## Disclaimer

This repository is based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). It is provided for learning and research purposes only.
