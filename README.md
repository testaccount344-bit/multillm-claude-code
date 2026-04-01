# multi-claude

Connect any AI provider to Claude Code with `/connect`. No env files needed.

Based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com).

## What This Is

The leaked Claude Code source only works with Anthropic's API. This fork adds support for 40+ AI providers — OpenAI, Google, DeepSeek, Groq, OpenRouter, and many more — all configurable from inside the terminal with `/connect`.

You don't need to edit `.env` files or config files. Just start the app, type `/connect`, pick your provider, enter your API key, and you're done.

## Quick Start

```bash
# Install bun
npm install -g bun

# Clone and install
git clone https://github.com/testaccount344-bit/multi-claude.git
cd multi-claude
bun install

# Start
bun --env-file=.env ./src/entrypoints/cli.tsx
```

No API key needed to start. Type `/connect` in the TUI to add your provider.

## Commands

### /connect

Pick from 40+ providers and enter API keys interactively. The flow is:

1. **Provider picker** — fuzzy-searchable list of all supported providers
2. **Auth method** — some providers offer multiple auth options (e.g. OpenAI: API Key or ChatGPT Codex OAuth)
3. **Enter credentials** — step through each required field. Secrets are masked with `*`. Optional fields can be skipped.
4. **Model selection** — after connecting, available models are fetched from the provider's API and you can pick one

Supported auth methods:
- **API key** — paste your key, it gets saved to your global config
- **OAuth PKCE** — browser opens, you authorize, access token is exchanged and stored automatically (ChatGPT Codex)
- **Device code** — for providers like GitHub Copilot that use device code flow

Credentials persist across sessions in your global config file.

### /providers

Shows all models from all your connected providers, grouped by provider. Each model shows whether it's enabled (`●`) or disabled (`○`).

- Press **Enter** on any model to toggle it on/off
- **Search** filters across model names and provider names simultaneously
- Disabled models are hidden from `/models` — this lets you curate exactly which models appear in your model picker
- Each model shows which provider it belongs to as a badge on the right side

This is useful when you have multiple providers connected and want to clean up your `/models` list to only show the models you actually use.

### /models

Select your active model for the current session. Only shows models you enabled in `/providers`.

## Supported Providers

**Popular**: Anthropic, OpenAI (API key + ChatGPT Codex OAuth), Google Vertex AI, Google AI Studio, OpenRouter, DeepSeek, Groq, xAI (Grok), Cohere, Mistral AI

**Subscriptions**: GitHub Copilot (device code), GitLab Duo (OAuth / PAT)

**Local**: Ollama, Ollama Cloud, LM Studio, llama.cpp, Hugging Face (17+ inference providers)

**Inference platforms**: Together AI, Fireworks AI, Cerebras, Deep Infra, Baseten, Moonshot AI, MiniMax, IO.NET, Cortecs, Firmware, Nebius, Venice AI, Z.AI, 302.AI

**Gateways**: Cloudflare AI Gateway, Cloudflare Workers AI, Helicone, Vercel AI Gateway

**Cloud**: Amazon Bedrock, Azure OpenAI, Azure Cognitive Services, Scaleway, OVHcloud, STACKIT

**Enterprise**: SAP AI Core

## Platform Notes

- **macOS / Linux**: `./bin/claude-haha`
- **Windows (PowerShell/cmd)**: `bun --env-file=.env ./src/entrypoints/cli.tsx`
- **Windows (Git Bash)**: `./bin/claude-haha`

Requires Bun 1.3.11-canary or later. The stable Bun release has a known issue with the `bun:bundle` compiler builtin on Windows.

## What Was Fixed

The leaked source had several issues that prevented it from running:

- Entry script was routing to a recovery CLI instead of the full TUI
- Missing `.md` files caused the Bun text loader to hang on startup
- The `modifiers-napi` native package threw errors on Windows
- `preload.ts` auto-set `LOCAL_RECOVERY=1`, skipping the normal setup flow
- The `bun:bundle` compiler builtin caused stack overflows on Windows
- No multi-provider support — hardcoded to Anthropic only

All of these are fixed in this fork.

## Disclaimer

This repository is based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). Provided for learning and research purposes only.
