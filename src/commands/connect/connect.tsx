import * as React from 'react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { execSync } from 'child_process'
import chalk from 'chalk'
import TextInput from '../../components/TextInput.js'
import { FuzzyPicker } from '../../components/design-system/FuzzyPicker.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import { Box, Text, useTheme } from '../../ink.js'
import { useKeybindings } from '../../keybindings/useKeybinding.js'
import { useTerminalSize } from '../../hooks/useTerminalSize.js'
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import {
  PROVIDERS,
  searchProviders,
  type ProviderConfig,
  type EnvVarDef,
  type AuthOption,
} from './providers.js'

type ResolvedField = EnvVarDef & { isBaseUrl?: boolean }

/**
 * Key entry step: renders a single env var field with TextInput.
 */
function KeyEntryStep({
  envVar,
  value,
  onChange,
  onSubmit,
  onSkip,
  onCancel,
  stepLabel,
  totalSteps,
  canSkip,
}: {
  envVar: EnvVarDef
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onSkip: () => void
  onCancel: () => void
  stepLabel: string
  totalSteps: number
  canSkip: boolean
}) {
  const [cursorOffset, setCursorOffset] = useState(0)
  const terminalSize = useTerminalSize()
  const [theme] = useTheme()

  const bindings = useMemo(
    () => ({
      'confirm:yes': onSubmit,
      ...(canSkip ? { 'confirm:no': onSkip } : {}),
    }),
    [onSubmit, onSkip, canSkip],
  )

  useKeybindings(bindings, { context: 'Confirmation', isActive: true })

  return (
    <Dialog
      title={`Connect to a Provider`}
      onCancel={onCancel}
      color="permission"
      isCancelActive={true}
    >
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Text dimColor>Step {stepLabel} of {totalSteps}</Text>
        <Text bold color="permission">{envVar.label}</Text>
        {envVar.help && <Text dimColor>{envVar.help}</Text>}
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          focus={true}
          placeholder={envVar.required ? 'Required' : 'Optional'}
          mask={envVar.secret ? '*' : undefined}
          columns={terminalSize.columns}
          cursorOffset={cursorOffset}
          onChangeCursorOffset={setCursorOffset}
          showCursor={true}
        />
        <Box flexDirection="row" gap={2}>
          <Text dimColor>Enter to confirm</Text>
          {canSkip && <Text dimColor>Esc to skip</Text>}
          <Text dimColor>Ctrl+C to cancel</Text>
        </Box>
      </Box>
    </Dialog>
  )
}

/**
 * Auth method picker — shown when a provider has multiple auth options
 * (e.g. OpenAI: API Key vs ChatGPT Codex OAuth).
 */
function AuthMethodPicker({
  provider,
  onSelect,
  onCancel,
}: {
  provider: ProviderConfig
  onSelect: (option: AuthOption) => void
  onCancel: () => void
}) {
  const options = provider.authOptions ?? []
  return (
    <FuzzyPicker
      title={`${provider.name} — Select auth method`}
      placeholder="Choose..."
      items={options}
      getKey={item => item.id}
      renderItem={(item, isFocused) => (
        <Text bold={isFocused}>{item.label}</Text>
      )}
      visibleCount={8}
      onQueryChange={() => {}}
      onSelect={onSelect}
      onCancel={onCancel}
      emptyMessage="No auth methods available"
    />
  )
}

/**
 * OAuth flow: opens browser, waits for user to paste the auth code.
 */
function OAuthFlow({
  providerName,
  authUrl,
  onComplete,
  onCancel,
}: {
  providerName: string
  authUrl: string
  onComplete: (code: string) => void
  onCancel: () => void
}) {
  const [cursorOffset, setCursorOffset] = useState(0)
  const [code, setCode] = useState('')
  const terminalSize = useTerminalSize()

  // Open browser on mount
  useEffect(() => {
    try {
      if (process.platform === 'win32') {
        execSync(`start "" "${authUrl}"`)
      } else if (process.platform === 'darwin') {
        execSync(`open "${authUrl}"`)
      } else {
        execSync(`xdg-open "${authUrl}" 2>/dev/null || open "${authUrl}" 2>/dev/null`)
      }
    } catch {
      // Browser open failed — user can still navigate manually
    }
  }, [authUrl])

  const bindings = useMemo(
    () => ({ 'confirm:yes': () => { if (code.trim()) onComplete(code.trim()) } }),
    [code, onComplete],
  )

  useKeybindings(bindings, { context: 'Confirmation', isActive: !!code.trim() })

  return (
    <Dialog
      title={`Connect to ${providerName}`}
      onCancel={onCancel}
      color="permission"
      isCancelActive={true}
    >
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Text dimColor>Opening your browser for authentication...</Text>
        <Box>
          <Text color="permission">{'>'} </Text>
          <Text color="permission">{authUrl}</Text>
        </Box>
        <Text dimColor>Enter the authorization code shown:</Text>
        <TextInput
          value={code}
          onChange={setCode}
          onSubmit={() => { if (code.trim()) onComplete(code.trim()) }}
          focus={true}
          placeholder="Paste the code from your browser"
          columns={terminalSize.columns}
          cursorOffset={cursorOffset}
          onChangeCursorOffset={setCursorOffset}
          showCursor={true}
        />
        <Box flexDirection="row" gap={2}>
          <Text dimColor>Enter to confirm</Text>
          <Text dimColor>Ctrl+C to cancel</Text>
        </Box>
      </Box>
    </Dialog>
  )
}

/**
 * Multi-step key entry wizard for a provider + chosen auth option.
 */
function KeyEntryFlow({
  provider,
  authOption,
  onComplete,
  onCancel,
}: {
  provider: ProviderConfig
  authOption: AuthOption | null
  onComplete: (envVars: Record<string, string>, baseUrl?: string) => void
  onCancel: () => void
}) {
  const [fieldIndex, setFieldIndex] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [baseUrl, setBaseUrl] = useState<string | undefined>()
  const [oauthCode, setOauthCode] = useState<string | null>(null)

  // Build ordered list of fields from the chosen auth option (or provider default)
  const fields = useMemo(() => {
    const sourceEnvVars = authOption?.envVars ?? provider.envVars
    const list: ResolvedField[] = [...sourceEnvVars]
    const hasBaseUrl = authOption?.hasBaseUrl ?? provider.hasBaseUrl
    if (hasBaseUrl) {
      list.push({
        name: 'ANTHROPIC_BASE_URL',
        label: 'Base URL',
        required: false,
        secret: false,
        help: 'Custom API endpoint (e.g. https://api.example.com/v1)',
        isBaseUrl: true,
      })
    }
    return list
  }, [provider, authOption])

  // OAuth flow: no env vars, has a docsUrl — open browser instead
  if (authOption && fields.length === 0 && authOption.docsUrl) {
    if (oauthCode) {
      onComplete({ OPENAI_CODEX_OAUTH: oauthCode }, undefined)
      return null
    }
    return (
      <OAuthFlow
        providerName={provider.name}
        authUrl={authOption.docsUrl}
        onComplete={(code) => setOauthCode(code)}
        onCancel={onCancel}
      />
    )
  }

  // Skip providers with no fields (e.g. device-code auth)
  if (fields.length === 0) {
    onComplete({}, undefined)
    return null
  }

  const currentField = fields[fieldIndex]
  if (!currentField) {
    onComplete(values, baseUrl)
    return null
  }

  const currentValue = currentField.isBaseUrl
    ? (baseUrl ?? '')
    : (values[currentField.name] ?? '')

  const handleChange = useCallback(
    (v: string) => {
      if (currentField.isBaseUrl) {
        setBaseUrl(v)
      } else {
        setValues(prev => ({ ...prev, [currentField.name]: v }))
      }
    },
    [currentField],
  )

  const handleSubmit = useCallback(() => {
    const nextIndex = fieldIndex + 1
    if (nextIndex < fields.length) {
      setFieldIndex(nextIndex)
    } else {
      onComplete(
        currentField.isBaseUrl ? values : { ...values, [currentField.name]: currentValue },
        currentField.isBaseUrl ? currentValue || undefined : baseUrl,
      )
    }
  }, [fieldIndex, fields.length, values, baseUrl, currentField, currentValue, onComplete])

  const handleSkip = useCallback(() => {
    if (!currentField.required) {
      const nextIndex = fieldIndex + 1
      if (nextIndex < fields.length) {
        setFieldIndex(nextIndex)
      } else {
        onComplete(values, baseUrl)
      }
    }
  }, [currentField, fieldIndex, fields.length, values, baseUrl, onComplete])

  return (
    <KeyEntryStep
      envVar={currentField}
      value={currentValue}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      onCancel={onCancel}
      stepLabel={`${fieldIndex + 1}`}
      totalSteps={fields.length}
      canSkip={!currentField.required}
    />
  )
}

/**
 * Provider selection picker using FuzzyPicker.
 */
function ConnectPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (provider: ProviderConfig) => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = query.length > 0 ? searchProviders(query) : PROVIDERS

  return (
    <FuzzyPicker
      title="Connect to a Provider"
      placeholder="Search providers..."
      items={filtered}
      getKey={item => item.id}
      renderItem={(item, isFocused) => (
        <Box flexDirection="row" gap={2}>
          <Text bold={isFocused}>{item.name}</Text>
          <Text dimColor>— {item.description}</Text>
        </Box>
      )}
      visibleCount={12}
      onQueryChange={q => setQuery(q)}
      onSelect={onSelect}
      onCancel={onCancel}
      emptyMessage={query ? `No provider matching "${query}"` : 'No providers available'}
      matchLabel={`${filtered.length} provider${filtered.length !== 1 ? 's' : ''}`}
    />
  )
}

/**
 * Main connect command component.
 */
function ConnectCommand({
  onDone,
}: {
  onDone: LocalJSXCommandOnDone
}) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null)
  const [selectedAuthOption, setSelectedAuthOption] = useState<AuthOption | null>(null)

  const handleProviderSelect = useCallback((provider: ProviderConfig) => {
    setSelectedProvider(provider)
    // If provider has authOptions, show auth method picker first
    if (provider.authOptions && provider.authOptions.length > 0) {
      return
    }
    // Otherwise go straight to key entry
    setSelectedAuthOption(null)
  }, [])

  const handleAuthOptionSelect = useCallback((option: AuthOption) => {
    setSelectedAuthOption(option)
  }, [])

  const handleKeysComplete = useCallback(
    (envVars: Record<string, string>, baseUrl?: string) => {
      if (!selectedProvider) return

      const config = getGlobalConfig()
      const currentEnv = { ...(config.env ?? {}) }

      for (const [key, value] of Object.entries(envVars)) {
        if (value) {
          currentEnv[key] = value
        }
      }

      if (baseUrl) {
        currentEnv['ANTHROPIC_BASE_URL'] = baseUrl
      }

      saveGlobalConfig(prev => ({
        ...prev,
        env: currentEnv,
      }))

      onDone(
        `Connected to ${chalk.bold(selectedProvider.name)}. Restart session for changes to take effect.`,
        { display: 'system' as CommandResultDisplay },
      )
    },
    [selectedProvider, onDone],
  )

  const handleCancel = useCallback(() => {
    onDone('Connect cancelled')
  }, [onDone])

  const handleBack = useCallback(() => {
    if (selectedAuthOption) {
      setSelectedAuthOption(null)
    } else if (selectedProvider) {
      setSelectedProvider(null)
    }
  }, [selectedProvider, selectedAuthOption])

  // Phase 1: pick provider
  if (!selectedProvider) {
    return <ConnectPicker onSelect={handleProviderSelect} onCancel={handleCancel} />
  }

  // Phase 1b: pick auth method (if provider has multiple options)
  if (selectedProvider.authOptions && selectedProvider.authOptions.length > 0 && !selectedAuthOption) {
    return (
      <AuthMethodPicker
        provider={selectedProvider}
        onSelect={handleAuthOptionSelect}
        onCancel={handleCancel}
      />
    )
  }

  // Phase 2: enter API keys
  return (
    <KeyEntryFlow
      provider={selectedProvider}
      authOption={selectedAuthOption}
      onComplete={handleKeysComplete}
      onCancel={handleCancel}
    />
  )
}

export const call = async (
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
): Promise<React.ReactNode> => {
  return <ConnectCommand onDone={onDone} />
}
