# multi-claude

Connect any AI provider to Claude Code with `/connect`. No env files needed.

Based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com).

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

Pick from 40+ providers and enter API keys interactively. Supports:

- API key auth (most providers)
- OAuth PKCE flow (ChatGPT Codex)
- Device code auth (GitHub Copilot)

Credentials are saved to your global config and persist across sessions.

### /providers

Manage models from connected providers. Enable or disable individual models so only the ones you want appear in `/models`. Search across model names and provider names.

### /models

Select your active model. Filtered to only show models you enabled in `/providers`.

## Supported Providers

Anthropic, OpenAI (API key + ChatGPT Codex OAuth), Google Vertex AI, Google AI Studio, OpenRouter, DeepSeek, Groq, xAI (Grok), Cohere, Mistral AI, Together AI, Fireworks AI, Cerebras, Amazon Bedrock, Azure OpenAI, Azure Cognitive Services, GitHub Copilot, GitLab Duo, Ollama, Ollama Cloud, LM Studio, llama.cpp, Hugging Face, Deep Infra, Baseten, Moonshot AI, MiniMax, IO.NET, Cortecs, Firmware, Nebius, Venice AI, Z.AI, 302.AI, Cloudflare AI Gateway, Cloudflare Workers AI, Helicone, Vercel AI Gateway, Scaleway, OVHcloud, STACKIT, SAP AI Core.

## Platform Notes

- macOS / Linux: `./bin/claude-haha`
- Windows: `bun --env-file=.env ./src/entrypoints/cli.tsx`
- Windows Git Bash: `./bin/claude-haha`

## Disclaimer

This repository is based on the Claude Code source leaked from the Anthropic npm registry on 2026-03-31. All original source code copyrights belong to [Anthropic](https://www.anthropic.com). Provided for learning and research purposes only.
