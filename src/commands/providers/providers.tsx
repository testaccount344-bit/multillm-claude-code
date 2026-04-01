import * as React from 'react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import chalk from 'chalk'
import { FuzzyPicker } from '../../components/design-system/FuzzyPicker.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import { Box, Text } from '../../ink.js'
import { useKeybindings } from '../../keybindings/useKeybinding.js'
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import {
  PROVIDERS,
  getProviderById,
  type ProviderConfig,
} from '../connect/providers.js'

interface ProviderModel {
  id: string
  name: string
  providerId: string
  providerName: string
  enabled: boolean
}

/**
 * Get connected providers from env config
 */
function getConnectedProviders(): { provider: ProviderConfig; connected: boolean; envKey?: string }[] {
  const config = getGlobalConfig()
  const env = config.env || {}

  return PROVIDERS.map(p => {
    // Check direct env vars first
    let primaryEnvVar = p.envVars?.[0]?.name
    let connected = primaryEnvVar ? !!env[primaryEnvVar] : false

    // If not connected, check authOptions env vars (e.g. OpenAI Codex OAuth)
    if (!connected && p.authOptions) {
      for (const option of p.authOptions) {
        if (option.oauth) {
          // Check OAuth token env var
          if (env[option.oauth.tokenEnvVar]) {
            connected = true
            primaryEnvVar = option.oauth.tokenEnvVar
            break
          }
        }
        if (option.envVars?.[0]?.name && env[option.envVars[0].name]) {
          connected = true
          primaryEnvVar = option.envVars[0].name
          break
        }
      }
    }

    return { provider: p, connected, envKey: primaryEnvVar }
  }).filter(x => x.connected)
}

/**
 * Get all models for a provider (hardcoded + fetched if possible)
 */
function getProviderModels(provider: ProviderConfig, env: Record<string, string>): ProviderModel[] {
  const models: ProviderModel[] = []

  // Hardcoded model lists for major providers
  const hardcodedModels: Record<string, string[]> = {
    'anthropic': [
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250414',
      'claude-opus-4-1-20250414',
      'claude-haiku-4-20250514',
      'claude-sonnet-4-5-20251101',
      'claude-opus-4-5-20251101',
    ],
    'openai': [
      'gpt-5',
      'gpt-5-codex',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'o3',
      'o3-pro',
      'o4-mini',
    ],
    'google-ai-studio': [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ],
    'deepseek': [
      'deepseek-chat',
      'deepseek-reasoner',
    ],
    'groq': [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    'xai': [
      'grok-3',
      'grok-3-mini',
      'grok-3-fast',
      'grok-3-mini-fast',
    ],
    'openrouter': [
      'openai/gpt-5',
      'anthropic/claude-sonnet-4.5',
      'anthropic/claude-opus-4.5',
      'google/gemini-2.5-pro',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2',
      'deepseek/deepseek-chat',
    ],
    'cohere': [
      'command-a',
      'command-r-plus',
      'command-r',
    ],
    'mistral': [
      'mistral-large-latest',
      'mistral-small-latest',
      'codestral-latest',
      'ministral-8b-latest',
    ],
    'together-ai': [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
    'fireworks-ai': [
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
      'accounts/fireworks/models/mixtral-8x7b-instruct',
    ],
    'cerebras': [
      'llama3.1-8b',
      'llama3.1-70b',
      'llama3.3-70b',
    ],
    'moonshot-ai': [
      'kimi-k2-0905',
      'kimi-k2-instruct',
    ],
    'minimax': [
      'MiniMax-M2.1',
      'MiniMax-M2.7-highspeed',
    ],
    'z-ai': [
      'glm-4.6',
      'glm-4-plus',
    ],
  }

  const providerModels = hardcodedModels[provider.id] || []
  for (const modelId of providerModels) {
    models.push({
      id: modelId,
      name: modelId,
      providerId: provider.id,
      providerName: provider.name,
      enabled: true,
    })
  }

  return models
}

/**
 * Toggle model enabled/disabled state
 */
function toggleModel(modelId: string, providerId: string): void {
  const config = getGlobalConfig()
  const disabledModels = config.disabledModels || []
  const key = `${providerId}/${modelId}`

  if (disabledModels.includes(key)) {
    saveGlobalConfig(prev => ({
      ...prev,
      disabledModels: disabledModels.filter(m => m !== key),
    }))
  } else {
    saveGlobalConfig(prev => ({
      ...prev,
      disabledModels: [...disabledModels, key],
    }))
  }
}

/**
 * Check if a model is enabled
 */
function isModelEnabled(modelId: string, providerId: string): boolean {
  const config = getGlobalConfig()
  const disabledModels = config.disabledModels || []
  return !disabledModels.includes(`${providerId}/${modelId}`)
}

/**
 * Provider group header with model count
 */
function ProviderGroupHeader({
  provider,
  modelCount,
  enabledCount,
}: {
  provider: ProviderConfig
  modelCount: number
  enabledCount: number
}) {
  return (
    <Box flexDirection="row" gap={1}>
      <Text bold color="permission">{provider.name}</Text>
      <Text dimColor>({enabledCount}/{modelCount} enabled)</Text>
    </Box>
  )
}

/**
 * Single model row with toggle indicator
 */
function ModelRow({
  model,
  onToggle,
  isFocused,
}: {
  model: ProviderModel
  onToggle: () => void
  isFocused: boolean
}) {
  const enabled = isModelEnabled(model.id, model.providerId)

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={enabled ? 'success' : 'error'} bold={isFocused}>
        {enabled ? '●' : '○'}
      </Text>
      <Text bold={isFocused}>{model.name}</Text>
      <Text dimColor>— {model.providerName}</Text>
    </Box>
  )
}

/**
 * Main providers command: shows all models from connected providers with enable/disable
 */
function ProvidersCommand({
  onDone,
}: {
  onDone: LocalJSXCommandOnDone
}) {
  const [query, setQuery] = useState('')
  const [allModels, setAllModels] = useState<ProviderModel[]>([])

  // Build full model list from connected providers
  useEffect(() => {
    const config = getGlobalConfig()
    const env = config.env || {}
    const connected = getConnectedProviders()
    const models: ProviderModel[] = []

    for (const { provider } of connected) {
      const providerModels = getProviderModels(provider, env)
      models.push(...providerModels)
    }

    setAllModels(models)
  }, [])

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query) return allModels
    const q = query.toLowerCase()
    return allModels.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.providerName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    )
  }, [allModels, query])

  // Group by provider
  const grouped = useMemo(() => {
    const map = new Map<string, ProviderModel[]>()
    for (const model of filtered) {
      const existing = map.get(model.providerId) || []
      existing.push(model)
      map.set(model.providerId, existing)
    }
    return Array.from(map.entries())
  }, [filtered])

  const handleToggle = useCallback((model: ProviderModel) => {
    toggleModel(model.id, model.providerId)
    // Re-render by updating state
    setAllModels(prev => [...prev])
  }, [])

  const handleDone = useCallback(() => {
    const enabledCount = allModels.filter(m => isModelEnabled(m.id, m.providerId)).length
    onDone(
      `Provider models updated. ${enabledCount} model${enabledCount !== 1 ? 's' : ''} enabled.`,
      { display: 'system' as CommandResultDisplay },
    )
  }, [allModels, onDone])

  const handleCancel = useCallback(() => {
    onDone('Providers management cancelled')
  }, [onDone])

  // Build items for FuzzyPicker — flatten groups with section headers
  type PickerItem =
    | { type: 'header'; providerId: string; provider: ProviderConfig; modelCount: number; enabledCount: number }
    | { type: 'model'; model: ProviderModel }

  const pickerItems: PickerItem[] = []
  for (const [providerId, models] of grouped) {
    const provider = getProviderById(providerId)
    if (!provider) continue
    const enabledCount = models.filter(m => isModelEnabled(m.id, m.providerId)).length
    pickerItems.push({
      type: 'header',
      providerId,
      provider,
      modelCount: models.length,
      enabledCount,
    })
    for (const model of models) {
      pickerItems.push({ type: 'model', model })
    }
  }

  return (
    <FuzzyPicker
      title="Manage Provider Models"
      placeholder="Search models or providers..."
      items={pickerItems}
      getKey={item => item.type === 'header' ? `header-${item.providerId}` : `model-${item.model.providerId}/${item.model.id}`}
      renderItem={(item, isFocused) => {
        if (item.type === 'header') {
          return (
            <Box flexDirection="row" gap={1}>
              <Text bold color="permission">▸ {item.provider.name}</Text>
              <Text dimColor>({item.enabledCount}/{item.modelCount} enabled)</Text>
            </Box>
          )
        }
        const enabled = isModelEnabled(item.model.id, item.model.providerId)
        return (
          <Box flexDirection="row" gap={1}>
            <Text color={enabled ? 'success' : 'error'}>
              {enabled ? '●' : '○'}
            </Text>
            <Text bold={isFocused}>{item.model.name}</Text>
            <Text dimColor>— {item.model.providerName}</Text>
          </Box>
        )
      }}
      visibleCount={14}
      onQueryChange={q => setQuery(q)}
      onSelect={(item) => {
        if (item.type === 'model') {
          handleToggle(item.model)
        }
      }}
      onCancel={handleCancel}
      emptyMessage={query ? `No models matching "${query}"` : 'No connected providers. Use /connect first.'}
      matchLabel={`${pickerItems.filter(i => i.type === 'model').length} model${pickerItems.filter(i => i.type === 'model').length !== 1 ? 's' : ''}`}
      selectAction="toggle"
      extraHints={
        <Box flexDirection="row" gap={1}>
          <Text dimColor>Enter to toggle</Text>
          <Text dimColor>Esc to finish</Text>
        </Box>
      }
    />
  )
}

export const call = async (
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
): Promise<React.ReactNode> => {
  return <ProvidersCommand onDone={onDone} />
}
