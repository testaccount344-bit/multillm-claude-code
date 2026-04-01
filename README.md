# MultiLLM Claude Code

```
 ███╗   ███╗ █████╗ ███████╗███████╗    ██████╗ ██████╗  ██████╗
 ████╗ ████║██╔══██╗██╔════╝██╔════╝   ██╔════╝ ██╔══██╗██╔═══██╗
 ██╔████╔██║███████║███████╗█████╗     ██║  ███╗██████╔╝██║   ██║
 ██║╚██╔╝██║██╔══██║╚════██║██╔══╝     ██║   ██║██╔══██╗██║   ██║
 ██║ ╚═╝ ██║██║  ██║███████║███████╗   ╚██████╔╝██║  ██║╚██████╔╝
 ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
```

<p align="center">
  <strong>Connect ANY AI provider with <code>/connect</code> — no env files needed.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#connect-command">/connect</a> •
  <a href="#providers-command">/providers</a> •
  <a href="#supported-providers">Providers</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-f9f?style=flat-square&logo=bun" alt="Bun runtime">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/UI-Ink%20%2B%20React-61dafb?style=flat-square&logo=react" alt="Ink + React">
  <img src="https://img.shields.io/badge/providers-40%2B-ff6b6b?style=flat-square" alt="40+ Providers">
  <img src="https://img.shields.io/badge/models-500%2B-4ecdc4?style=flat-square" alt="500+ Models">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Cross-platform">
</p>

<p align="center">
  <img src="docs/00runtime.png" alt="Runtime screenshot" width="800">
</p>

> **Origin**: Based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). This fork adds multi-provider support via `/connect` and `/providers` commands, Windows compatibility fixes, and real OAuth PKCE flows.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔌 **`/connect`** | Connect any AI provider interactively — pick from 40+ providers, enter API keys, done |
| 🎛️ **`/providers`** | Manage all connected providers — enable/disable individual models with toggle controls |
| 🔍 **Search everywhere** | Fuzzy search in `/connect`, `/providers`, and `/models` — find anything instantly |
| 🔐 **Real OAuth** | ChatGPT Codex OAuth with proper PKCE flow — no token scraping, official auth |
| 📋 **Model discovery** | Auto-fetches available models from each provider after connecting |
| 🖥️ **Full Ink TUI** | Pixel-perfect recreation of the official Claude Code terminal interface |
| 🪟 **Windows support** | Runs on PowerShell, cmd, and Git Bash — no WSL required |
| 🔧 **MCP + Plugins** | Full MCP server, plugin, and Skills support |
| 📡 **Headless mode** | `--print` for scripts and CI pipelines |

---

## 🚀 Quick Start

### 1. Install Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# npm (cross-platform)
npm install -g bun
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

# Windows — PowerShell / cmd
bun --env-file=.env ./src/entrypoints/cli.tsx

# Windows — Git Bash
./bin/claude-haha
```

> **No API key needed to start.** Once the TUI is running, type `/connect` to add your provider.

### 4. Connect Your Provider

```
/connect
```

Searchable provider picker → select provider → enter API key → done. Credentials saved automatically.

---

## 🔌 /connect Command

Connect any AI provider without touching config files.

### Step 1 — Provider Picker

```
┌ Connect to a Provider
│ Type to search…
│ > Anthropic — Claude Haiku, Sonnet, Opus
│   OpenAI — GPT-4, GPT-5, o-series, Codex
│   OpenRouter — Unified access to 100+ models
│   DeepSeek — DeepSeek Reasoner & chat
│   Groq — Ultra-fast Llama, Mixtral
│   xAI (Grok) — Grok models
│   Google Vertex AI — Gemini via Google Cloud
│   ...
│
│ ↑/↓ navigate · Enter select · Esc cancel
```

### Step 2 — Auth Method (if applicable)

Some providers offer multiple auth methods:

```
┌ OpenAI — Select auth method
│ > API Key
│   ChatGPT Codex (OAuth)
│
│ ↑/↓ navigate · Enter select · Esc cancel
```

### Step 3 — Enter Credentials

Secrets are masked. Optional fields can be skipped.

```
┌ Connect to a Provider
│   Step 1 of 2
│
│   API Key
│   > sk-ant-█████████████
│
│   Enter to confirm · Esc to skip · Ctrl+C to cancel
```

### ChatGPT Codex OAuth

Select "ChatGPT Codex (OAuth)" → browser opens → real PKCE flow with local callback server → access token stored automatically.

```
┌ Connect to OpenAI
│ Waiting for authorization callback on port 8085...
│
│ Opening browser for authentication...
│
│ Ctrl+C to cancel
```

---

## 🎛️ /providers Command

Manage all connected providers and their models.

```
┌ Manage Provider Models
│ Type to search models or providers...
│
│ ▸ Anthropic (5/5 enabled)
│   ● claude-sonnet-4-20250514 — Anthropic
│   ● claude-opus-4-20250414 — Anthropic
│   ○ claude-haiku-4-20250514 — Anthropic
│
│ ▸ OpenAI (8/10 enabled)
│   ● gpt-5 — OpenAI
│   ● gpt-5-codex — OpenAI
│   ○ gpt-5-nano — OpenAI
│
│ ▸ OpenRouter (7/7 enabled)
│   ● openai/gpt-5 — OpenRouter
│   ● anthropic/claude-sonnet-4.5 — OpenRouter
│
│ Enter to toggle · Esc to finish
```

- **`●`** = enabled (appears in `/models`)
- **`○`** = disabled (hidden from `/models`)
- Press **Enter** on any model to toggle it
- **Search** filters across model names and provider names

---

## 📋 Supported Providers

### 🔥 Popular
| Provider | Models | Auth |
|---|---|---|
| **Anthropic** | Claude Haiku, Sonnet, Opus | API Key |
| **OpenAI** | GPT-4, GPT-5, o-series, Codex | API Key / OAuth |
| **Google Vertex AI** | Gemini via Google Cloud | Service Account |
| **OpenRouter** | 100+ models, one key | API Key |
| **DeepSeek** | Reasoner & chat | API Key |
| **Groq** | Ultra-fast Llama, Mixtral | API Key |
| **xAI (Grok)** | Grok models | API Key |
| **Cohere** | Command, Aya | API Key |
| **Mistral AI** | Large, Codestral | API Key |

### 🔑 Subscriptions
| Provider | Models | Auth |
|---|---|---|
| **GitHub Copilot** | Copilot models | Device Code |
| **GitLab Duo** | Claude via Agent Platform | OAuth / PAT |

### 🏠 Open Source / Local
| Provider | Models | Auth |
|---|---|---|
| **Ollama** | Local models | None |
| **LM Studio** | Local models | None |
| **llama.cpp** | Local models | None |
| **Hugging Face** | 17+ inference providers | API Token |

### ⚡ Inference Platforms
| Provider | Notable Models |
|---|---|
| **Together AI** | Llama, Mixtral, Qwen |
| **Fireworks AI** | Llama, Mixtral |
| **Cerebras** | Llama (WSE-3 speed) |
| **Deep Infra** | Open models, cheap |
| **Moonshot AI** | Kimi K2 |
| **MiniMax** | M2.1 |
| **IO.NET** | Decentralized GPU |
| **Cortecs** | GPU cloud |
| **Firmware** | AI inference |
| **Nebius** | GPU cloud |
| **Venice AI** | Privacy-focused |
| **Z.AI** | GLM models |
| **302.AI** | Multi-model gateway |

### 🌐 Gateways
| Provider | Description |
|---|---|
| **Cloudflare AI Gateway** | Caching + analytics |
| **Cloudflare Workers AI** | Edge inference |
| **Helicone** | Observability + caching |
| **Vercel AI Gateway** | Analytics + routing |

### ☁️ Cloud
| Provider | Description |
|---|---|
| **Amazon Bedrock** | AWS managed AI |
| **Azure OpenAI** | OpenAI via Azure |
| **Azure Cognitive Services** | OpenAI via Azure Cognitive |
| **Google AI Studio** | Gemini via AI Studio |
| **Scaleway** | European cloud AI |
| **OVHcloud** | European AI endpoints |
| **STACKIT** | European sovereign AI |

### 🏢 Enterprise
| Provider | Description |
|---|---|
| **SAP AI Core** | SAP Business Technology Platform |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Terminal UI (Ink + React)               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │   REPL    │  │  Messages │  │   Components         │  │
│  │           │  │           │  │   • FuzzyPicker      │  │
│  │           │  │           │  │   • Dialog           │  │
│  │           │  │           │  │   • TextInput        │  │
│  │           │  │           │  │   • ModelPicker      │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Command Layer                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ /connect │  │ /providers│  │   /models            │  │
│  │ /model   │  │ /config   │  │   /help, /clear...   │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Service Layer                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │   API    │  │   OAuth   │  │   Settings/Config    │  │
│  │          │  │   PKCE    │  │   • userSettings     │  │
│  │          │  │           │  │   • globalConfig     │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │   Bun    │  │  Models   │  │  MCP + Plugins       │  │
│  │ Runtime  │  │  Fetch    │  │  + Skills            │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript |
| Terminal UI | React + [Ink](https://github.com/vadimdemedes/ink) |
| CLI parsing | Commander.js |
| API | Anthropic SDK |
| Protocols | MCP, LSP |
| OAuth | PKCE (Proof Key for Code Exchange) |

---

## 📁 Project Structure

```
bin/claude-haha          # Entry script
.env.example             # Environment variable template
src/
├── entrypoints/cli.tsx  # Main CLI entry
├── main.tsx             # Main TUI logic
├── screens/REPL.tsx     # Interactive REPL screen
├── commands/            # Slash commands
│   ├── connect/         # 🔌 /connect — provider connection
│   │   ├── index.ts     # Command registration
│   │   ├── connect.tsx  # UI: picker → OAuth → key entry
│   │   └── providers.ts # 40+ provider definitions
│   └── providers/       # 🎛️ /providers — model management
│       ├── index.ts     # Command registration
│       └── providers.tsx # Enable/disable models UI
├── components/          # UI components
├── tools/               # Agent tools (Bash, Edit, Grep, etc.)
├── services/            # Service layer (API, MCP, OAuth, etc.)
├── hooks/               # React hooks
└── utils/               # Utility functions
```

---

## 🔧 Fixes Applied

| Issue | Root Cause | Fix |
|---|---|---|
| TUI does not start | Entry script routed to recovery CLI | Restored full `cli.tsx` entry |
| Startup hangs | Missing `.md` files cause Bun text loader to hang | Added stub files |
| Enter key does nothing | `modifiers-napi` native package throws on Windows | Added try/catch fault tolerance |
| Setup skipped | `preload.ts` auto-set `LOCAL_RECOVERY=1` | Removed default setting |
| `bun:bundle` stack overflow | Bun compiler builtin broken on Windows | Polyfill + canary Bun workaround |
| No multi-provider support | Hardcoded to Anthropic only | Added `/connect` + `/providers` commands |

---

## ⚠️ Disclaimer

This repository is based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). It is provided for learning and research purposes only.
