/**
 * Unified model registry - aggregates models from all connected providers.
 * This is the single source of truth for available models across all providers.
 */

import { getGlobalConfig } from '../config.js'
import { PROVIDERS, getProviderById, type ProviderConfig } from '../../commands/connect/providers.js'

export interface UnifiedModel {
  /** Unique model ID (e.g. 'gpt-5', 'claude-sonnet-4') */
  id: string
  /** Display name */
  name: string
  /** Provider ID */
  providerId: string
  /** Provider display name */
  providerName: string
  /** Model tier/category */
  tier: 'flagship' | 'balanced' | 'fast' | 'reasoning' | 'coding' | 'budget'
  /** Context window (tokens) */
  contextWindow?: number
  /** Whether this model is enabled by the user */
  enabled: boolean
  /** Whether this model supports reasoning/thinking */
  supportsReasoning?: boolean
  /** Whether this model supports fast mode */
  supportsFastMode?: boolean
}

/**
 * Complete model database for all providers.
 * Organized by provider with accurate model IDs, names, and metadata.
 */
const MODEL_DATABASE: Record<string, {
  name: string
  models: Array<{
    id: string
    name: string
    tier: UnifiedModel['tier']
    contextWindow?: number
    supportsReasoning?: boolean
    supportsFastMode?: boolean
  }>
}> = {
  // ─── Anthropic ─────────────────────────────────────────────
  'anthropic': {
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-6-20260201', name: 'Sonnet 4.6', tier: 'balanced', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: true },
      { id: 'claude-opus-4-6-20260201', name: 'Opus 4.6', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5', tier: 'flagship', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'claude-sonnet-4-5-20251001', name: 'Sonnet 4.5', tier: 'balanced', contextWindow: 200000, supportsReasoning: true, supportsFastMode: true },
      { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', tier: 'budget', contextWindow: 200000, supportsReasoning: false, supportsFastMode: true },
      { id: 'claude-opus-4-1-20250801', name: 'Opus 4.1', tier: 'flagship', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', tier: 'balanced', contextWindow: 200000, supportsReasoning: true, supportsFastMode: true },
      { id: 'claude-opus-4-20250514', name: 'Opus 4', tier: 'flagship', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'claude-haiku-4-20250514', name: 'Haiku 4', tier: 'budget', contextWindow: 200000, supportsReasoning: false, supportsFastMode: true },
      { id: 'claude-3-7-sonnet-20250219', name: '3.7 Sonnet', tier: 'balanced', contextWindow: 200000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── OpenAI (API Key) ─────────────────────────────────────
  'openai': {
    name: 'OpenAI',
    models: [
      { id: 'gpt-5.3', name: 'GPT-5.3', tier: 'flagship', contextWindow: 400000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gpt-5.2', name: 'GPT-5.2', tier: 'flagship', contextWindow: 400000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', tier: 'flagship', contextWindow: 400000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.2-thinking', name: 'GPT-5.2 Thinking', tier: 'balanced', contextWindow: 400000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gpt-5.2-instant', name: 'GPT-5.2 Instant', tier: 'fast', contextWindow: 400000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gpt-5.1', name: 'GPT-5.1', tier: 'balanced', contextWindow: 256000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gpt-5', name: 'GPT-5', tier: 'balanced', contextWindow: 256000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', tier: 'fast', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano', tier: 'budget', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'o3', name: 'o3', tier: 'reasoning', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'o3-pro', name: 'o3 Pro', tier: 'reasoning', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'o4-mini', name: 'o4 Mini', tier: 'reasoning', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'balanced', contextWindow: 1000000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'fast', contextWindow: 1000000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', tier: 'budget', contextWindow: 1000000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── OpenAI Codex (OAuth) ─────────────────────────────────
  'openai-codex': {
    name: 'OpenAI Codex',
    models: [
      { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', tier: 'coding', contextWindow: 400000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex', tier: 'coding', contextWindow: 400000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.2-codex-pro', name: 'GPT-5.2 Codex Pro', tier: 'coding', contextWindow: 400000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.2-codex-instant', name: 'GPT-5.2 Codex Instant', tier: 'fast', contextWindow: 400000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gpt-5.2-codex-thinking', name: 'GPT-5.2 Codex Thinking', tier: 'coding', contextWindow: 400000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', tier: 'coding', contextWindow: 256000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', tier: 'coding', contextWindow: 256000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', tier: 'fast', contextWindow: 256000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── Google AI Studio ─────────────────────────────────────
  'google-ai-studio': {
    name: 'Google AI Studio',
    models: [
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gemini-3-flash', name: 'Gemini 3 Flash', tier: 'fast', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'fast', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: true },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', tier: 'budget', contextWindow: 1000000, supportsReasoning: false, supportsFastMode: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'fast', contextWindow: 1000000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── DeepSeek ─────────────────────────────────────────────
  'deepseek': {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-v3.2-speciale', name: 'V3.2 Speciale', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'deepseek-v3.2', name: 'V3.2', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'deepseek-v3.1', name: 'V3.1', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'deepseek-r1', name: 'R1', tier: 'reasoning', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'deepseek-coder', name: 'Coder', tier: 'coding', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'deepseek-chat', name: 'Chat', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── Groq ─────────────────────────────────────────────────
  'groq': {
    name: 'Groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', tier: 'fast', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tier: 'balanced', contextWindow: 32768, supportsReasoning: false, supportsFastMode: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tier: 'fast', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
      { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B', tier: 'budget', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
      { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B', tier: 'budget', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── xAI (Grok) ───────────────────────────────────────────
  'xai': {
    name: 'xAI (Grok)',
    models: [
      { id: 'grok-3', name: 'Grok 3', tier: 'flagship', contextWindow: 131072, supportsReasoning: true, supportsFastMode: false },
      { id: 'grok-3-mini', name: 'Grok 3 Mini', tier: 'fast', contextWindow: 131072, supportsReasoning: false, supportsFastMode: true },
      { id: 'grok-3-fast', name: 'Grok 3 Fast', tier: 'balanced', contextWindow: 131072, supportsReasoning: true, supportsFastMode: true },
      { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', tier: 'fast', contextWindow: 131072, supportsReasoning: false, supportsFastMode: true },
      { id: 'grok-2', name: 'Grok 2', tier: 'balanced', contextWindow: 131072, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── OpenRouter ───────────────────────────────────────────
  'openrouter': {
    name: 'OpenRouter',
    models: [
      { id: 'openai/gpt-5.3', name: 'GPT-5.3', tier: 'flagship', contextWindow: 400000, supportsReasoning: true, supportsFastMode: true },
      { id: 'openai/gpt-5.2', name: 'GPT-5.2', tier: 'flagship', contextWindow: 400000, supportsReasoning: true, supportsFastMode: true },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', tier: 'balanced', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: true },
      { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', tier: 'flagship', contextWindow: 200000, supportsReasoning: true, supportsFastMode: false },
      { id: 'google/gemini-3-pro', name: 'Gemini 3 Pro', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'flagship', contextWindow: 1000000, supportsReasoning: true, supportsFastMode: false },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'mistralai/mistral-large-2', name: 'Mistral Large 2', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', tier: 'reasoning', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'cohere/command-a', name: 'Cohere Command A', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── Cohere ───────────────────────────────────────────────
  'cohere': {
    name: 'Cohere',
    models: [
      { id: 'command-a', name: 'Command A', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'command-r-plus', name: 'Command R+', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'command-r', name: 'Command R', tier: 'fast', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── Mistral AI ───────────────────────────────────────────
  'mistral': {
    name: 'Mistral AI',
    models: [
      { id: 'mistral-large-2', name: 'Mistral Large 2', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'mistral-small-latest', name: 'Mistral Small', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'codestral-latest', name: 'Codestral', tier: 'coding', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'ministral-8b-latest', name: 'Ministral 8B', tier: 'fast', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'ministral-3b-latest', name: 'Ministral 3B', tier: 'budget', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'pixtral-large-latest', name: 'Pixtral Large', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── Together AI ──────────────────────────────────────────
  'together-ai': {
    name: 'Together AI',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', tier: 'balanced', contextWindow: 32768, supportsReasoning: false, supportsFastMode: true },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Turbo', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
    ],
  },
  // ─── Fireworks AI ─────────────────────────────────────────
  'fireworks-ai': {
    name: 'Fireworks AI',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'accounts/fireworks/models/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', tier: 'balanced', contextWindow: 32768, supportsReasoning: false, supportsFastMode: true },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen 2.5 72B', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'accounts/fireworks/models/deepseek-v3', name: 'DeepSeek V3', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── Cerebras ─────────────────────────────────────────────
  'cerebras': {
    name: 'Cerebras',
    models: [
      { id: 'llama3.3-70b', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
      { id: 'llama3.1-70b', name: 'Llama 3.1 70B', tier: 'balanced', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B', tier: 'fast', contextWindow: 8192, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── Moonshot AI ──────────────────────────────────────────
  'moonshot-ai': {
    name: 'Moonshot AI',
    models: [
      { id: 'kimi-k2-0905', name: 'Kimi K2', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'kimi-k2-instruct', name: 'Kimi K2 Instruct', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── MiniMax ──────────────────────────────────────────────
  'minimax': {
    name: 'MiniMax',
    models: [
      { id: 'MiniMax-M2.1', name: 'M2.1', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'MiniMax-M2.7-highspeed', name: 'M2.7 Highspeed', tier: 'fast', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
    ],
  },
  // ─── Z.AI ─────────────────────────────────────────────────
  'z-ai': {
    name: 'Z.AI',
    models: [
      { id: 'glm-4.6', name: 'GLM 4.6', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'glm-4-plus', name: 'GLM 4 Plus', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── Venice AI ────────────────────────────────────────────
  'venice-ai': {
    name: 'Venice AI',
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'deepseek-r1', name: 'DeepSeek R1', tier: 'reasoning', contextWindow: 128000, supportsReasoning: true, supportsFastMode: false },
      { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
  // ─── Nebius ───────────────────────────────────────────────
  'nebius': {
    name: 'Nebius',
    models: [
      { id: 'llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'balanced', contextWindow: 128000, supportsReasoning: false, supportsFastMode: true },
      { id: 'qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', tier: 'balanced', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
      { id: 'mistral-large-2', name: 'Mistral Large 2', tier: 'flagship', contextWindow: 128000, supportsReasoning: true, supportsFastMode: true },
    ],
  },
}

/**
 * Get all models from a specific provider
 */
function getModelsForProvider(providerId: string): UnifiedModel[] {
  const db = MODEL_DATABASE[providerId]
  if (!db) return []

  const provider = getProviderById(providerId)
  if (!provider) return []

  return db.models.map(m => ({
    id: m.id,
    name: m.name,
    providerId,
    providerName: provider.name,
    tier: m.tier,
    contextWindow: m.contextWindow,
    supportsReasoning: m.supportsReasoning,
    supportsFastMode: m.supportsFastMode,
    enabled: true,
  }))
}

/**
 * Get all models from all connected providers
 */
export function getConnectedModels(): UnifiedModel[] {
  const config = getGlobalConfig()
  const env = config.env || {}
  const disabledModels = config.disabledModels || []

  // Find which providers are connected
  const connectedProviderIds = new Set<string>()

  for (const provider of PROVIDERS) {
    // Check direct env vars
    if (provider.envVars?.[0]?.name && env[provider.envVars[0].name]) {
      connectedProviderIds.add(provider.id)
      continue
    }

    // Check auth options
    if (provider.authOptions) {
      for (const option of provider.authOptions) {
        if (option.oauth && env[option.oauth.tokenEnvVar]) {
          // Codex OAuth - use special provider ID
          connectedProviderIds.add('openai-codex')
          break
        }
        if (option.envVars?.[0]?.name && env[option.envVars[0].name]) {
          connectedProviderIds.add(provider.id)
          break
        }
      }
    }
  }

  // Aggregate all models from connected providers
  const allModels: UnifiedModel[] = []
  for (const providerId of connectedProviderIds) {
    const models = getModelsForProvider(providerId)
    for (const model of models) {
      // Check if disabled
      const key = `${model.providerId}/${model.id}`
      model.enabled = !disabledModels.includes(key)
      allModels.push(model)
    }
  }

  return allModels
}

/**
 * Get all available models (regardless of connection status)
 */
export function getAllModels(): UnifiedModel[] {
  const allModels: UnifiedModel[] = []
  for (const providerId of Object.keys(MODEL_DATABASE)) {
    allModels.push(...getModelsForProvider(providerId))
  }
  return allModels
}

/**
 * Get a model by its full ID (provider/model)
 */
export function getModelByFullId(fullId: string): UnifiedModel | undefined {
  const [providerId, modelId] = fullId.split('/')
  const models = getModelsForProvider(providerId)
  return models.find(m => m.id === modelId)
}

/**
 * Format a model for display
 */
export function formatModelDisplay(model: UnifiedModel): string {
  return `${model.name} (${model.providerName})`
}
