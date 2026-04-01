import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { FuzzyPicker } from '../../components/design-system/FuzzyPicker.js'
import { Box, Text } from '../../ink.js'
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import {
  getConnectedModels,
  type UnifiedModel,
} from '../../utils/model/registry.js'
import {
  getProviderById,
} from '../connect/providers.js'

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
 * Tier badge for display
 */
function tierBadge(tier: UnifiedModel['tier']): string {
  switch (tier) {
    case 'flagship': return '⚡'
    case 'balanced': return '◆'
    case 'fast': return '»'
    case 'reasoning': return '◈'
    case 'coding': return '⌘'
    case 'budget': return '◇'
    default: return ''
  }
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

  // Get all models from connected providers
  const allModels = getConnectedModels()

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query) return allModels
    const q = query.toLowerCase()
    return allModels.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.providerName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q),
    )
  }, [allModels, query])

  // Group by provider
  const grouped = useMemo(() => {
    const map = new Map<string, UnifiedModel[]>()
    for (const model of filtered) {
      const existing = map.get(model.providerId) || []
      existing.push(model)
      map.set(model.providerId, existing)
    }
    return Array.from(map.entries())
  }, [filtered])

  const handleToggle = useCallback((model: UnifiedModel) => {
    toggleModel(model.id, model.providerId)
    // Force re-render
    setQuery(q => q)
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
    | { type: 'header'; providerId: string; providerName: string; modelCount: number; enabledCount: number }
    | { type: 'model'; model: UnifiedModel }

  const pickerItems: PickerItem[] = []
  for (const [providerId, models] of grouped) {
    const enabledCount = models.filter(m => isModelEnabled(m.id, m.providerId)).length
    pickerItems.push({
      type: 'header',
      providerId,
      providerName: models[0]?.providerName || providerId,
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
              <Text bold color="permission">▸ {item.providerName}</Text>
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
            <Text bold={isFocused}>{tierBadge(item.model.tier)} {item.model.name}</Text>
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
