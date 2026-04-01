import * as React from 'react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { execSync } from 'child_process'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
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
  getProviderById,
  type ProviderConfig,
  type EnvVarDef,
  type AuthOption,
  type OAuthConfig,
  type ModelsApiConfig,
} from './providers.js'

type ResolvedField = EnvVarDef & { isBaseUrl?: boolean }
type ConnectPhase = 'pick-provider' | 'pick-auth' | 'enter-keys' | 'oauth' | 'pick-model' | 'done'

interface ConnectedState {
  provider: ProviderConfig
  authOption: AuthOption | null
  envVars: Record<string, string>
  baseUrl?: string
}

// ─── OAuth PKCE helpers ──────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function openBrowser(url: string): void {
  try {
    if (process.platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' })
    } else if (process.platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' })
    } else {
      execSync(`xdg-open "${url}" 2>/dev/null || open "${url}" 2>/dev/null`, { stdio: 'ignore' })
    }
  } catch {
    // Browser open failed — user can still navigate manually
  }
}

/**
 * Run a full OAuth 2.0 PKCE flow.
 * Returns the access token.
 */
async function runOAuthFlow(
  config: OAuthConfig,
  onStatus: (msg: string) => void,
): Promise<string> {
  const codeVerifier = generateRandomString(128)
  const codeChallenge = await sha256(codeVerifier)
  const state = generateRandomString(32)

  const authUrl = new URL(config.authorizeUrl)
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', config.redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.scopes.join(' '))
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  // Codex-specific params
  authUrl.searchParams.set('id_token_add_organizations', 'true')
  authUrl.searchParams.set('codex_cli_simplified_flow', 'true')
  authUrl.searchParams.set('originator', 'codex_cli_rs')

  onStatus('Opening browser for authentication...')
  openBrowser(authUrl.toString())

  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url?.startsWith('/auth/callback')) {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const returnedState = url.searchParams.get('state')
        const code = url.searchParams.get('code')

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end('<h1>Authentication failed: state mismatch</h1>')
          server.close()
          reject(new Error('OAuth state mismatch'))
          return
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end('<h1>Authentication failed: no code returned</h1>')
          server.close()
          reject(new Error('No authorization code returned'))
          return
        }

        // Exchange code for tokens
        onStatus('Exchanging authorization code for tokens...')
        const tokenParams = new URLSearchParams()
        tokenParams.set('grant_type', 'authorization_code')
        tokenParams.set('code', code)
        tokenParams.set('redirect_uri', config.redirectUri)
        tokenParams.set('client_id', config.clientId)
        tokenParams.set('code_verifier', codeVerifier)

        fetch(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString(),
        })
          .then(async (r) => {
            if (!r.ok) {
              const text = await r.text()
              throw new Error(`Token exchange failed (${r.status}): ${text}`)
            }
            return r.json()
          })
          .then((data) => {
            const accessToken = data.access_token
            if (!accessToken) throw new Error('No access_token in response')

            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <html><body style="font-family:sans-serif;text-align:center;padding:60px">
                <h2>Authentication Complete!</h2>
                <p>You can close this tab and return to the terminal.</p>
              </body></html>
            `)
            server.close()
            resolve(accessToken)
          })
          .catch((err) => {
            res.writeHead(500, { 'Content-Type': 'text/html' })
            res.end(`<h1>Token exchange failed</h1><p>${err.message}</p>`)
            server.close()
            reject(err)
          })
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    const port = parseInt(new URL(config.redirectUri).port, 10)
    server.listen(port, '127.0.0.1', () => {
      onStatus(`Waiting for authorization callback on port ${port}...`)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Close any other app using it and try again.`))
      } else {
        reject(err)
      }
    })
  })
}

// ─── Models fetching ─────────────────────────────────────────

interface ModelEntry {
  id: string
  name: string
  providerId: string
}

async function fetchModels(
  provider: ProviderConfig,
  apiKey: string,
  baseUrl?: string,
): Promise<ModelEntry[]> {
  const api = provider.modelsApi
  if (!api) return []

  const url = baseUrl && api.auth !== 'none'
    ? api.url.replace(/https?:\/\/[^/]+/, baseUrl.replace(/\/$/, ''))
    : api.url

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (api.auth === 'bearer') {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else if (api.auth === 'apiKey') {
    headers[api.headerName || 'Authorization'] = `Bearer ${apiKey}`
  }

  const resp = await fetch(url, { headers })
  if (!resp.ok) return []

  const data = await resp.json()
  const items = api.dataPath
    ? data[api.dataPath]
    : Array.isArray(data) ? data : []

  if (!Array.isArray(items)) return []

  return items.map((m: Record<string, string>) => ({
    id: m[api.idField || 'id'] || m.id || m.name || 'unknown',
    name: m[api.nameField || 'name'] || m[api.idField || 'id'] || m.id || 'unknown',
    providerId: provider.id,
  }))
}

// ─── UI Components ───────────────────────────────────────────

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
 * OAuth flow with real PKCE.
 */
function OAuthFlow({
  providerName,
  oauthConfig,
  onComplete,
  onCancel,
}: {
  providerName: string
  oauthConfig: OAuthConfig
  onComplete: (accessToken: string) => void
  onCancel: () => void
}) {
  const [status, setStatus] = useState('Starting OAuth...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    runOAuthFlow(oauthConfig, (msg) => {
      if (!cancelled) setStatus(msg)
    })
      .then((token) => {
        if (!cancelled) onComplete(token)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || String(err))
      })
    return () => { cancelled = true }
  }, [oauthConfig])

  return (
    <Dialog
      title={`Connect to ${providerName}`}
      onCancel={onCancel}
      color="permission"
      isCancelActive={true}
    >
      <Box flexDirection="column" gap={1} paddingX={1}>
        {error ? (
          <>
            <Text color="error">OAuth failed:</Text>
            <Text>{error}</Text>
            <Text dimColor>Press Esc to cancel</Text>
          </>
        ) : (
          <>
            <Text bold color="permission">{status}</Text>
            <Text dimColor>
              If your browser didn't open, navigate to:
            </Text>
            <Text color="permission">{oauthConfig.authorizeUrl}</Text>
            <Text dimColor>Ctrl+C to cancel</Text>
          </>
        )}
      </Box>
    </Dialog>
  )
}

/**
 * Model picker — shown after connecting to let user pick a model.
 */
function ModelPicker({
  models,
  providerName,
  onSelect,
  onCancel,
  onSkip,
}: {
  models: ModelEntry[]
  providerName: string
  onSelect: (model: ModelEntry) => void
  onCancel: () => void
  onSkip: () => void
}) {
  return (
    <FuzzyPicker
      title={`Select a model for ${providerName}`}
      placeholder="Search models..."
      items={models}
      getKey={item => item.id}
      renderItem={(item, isFocused) => (
        <Text bold={isFocused}>{item.name}</Text>
      )}
      visibleCount={12}
      onQueryChange={() => {}}
      onSelect={onSelect}
      onCancel={onCancel}
      emptyMessage="No models found"
      matchLabel={`${models.length} model${models.length !== 1 ? 's' : ''}`}
      selectAction="select"
      extraHints={
        <Box flexDirection="row" gap={1}>
          <Text dimColor>Esc to skip</Text>
        </Box>
      }
      onShiftTab={{
        action: 'skip',
        handler: onSkip,
      }}
    />
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

  // OAuth flow: auth option has oauth config
  if (authOption?.oauth) {
    return (
      <OAuthFlow
        providerName={provider.name}
        oauthConfig={authOption.oauth}
        onComplete={(token) => {
          const envVars: Record<string, string> = {
            [authOption.oauth!.tokenEnvVar]: token,
          }
          onComplete(envVars, undefined)
        }}
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
  const [phase, setPhase] = useState<ConnectPhase>('pick-provider')
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null)
  const [selectedAuthOption, setSelectedAuthOption] = useState<AuthOption | null>(null)
  const [connectedState, setConnectedState] = useState<ConnectedState | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelEntry[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const handleProviderSelect = useCallback((provider: ProviderConfig) => {
    setSelectedProvider(provider)
    if (provider.authOptions && provider.authOptions.length > 0) {
      setPhase('pick-auth')
    } else {
      setSelectedAuthOption(null)
      setPhase('enter-keys')
    }
  }, [])

  const handleAuthOptionSelect = useCallback((option: AuthOption) => {
    setSelectedAuthOption(option)
    setPhase('enter-keys')
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

      if (selectedAuthOption?.oauth?.tokenEnvVar === 'OPENAI_CODEX_ACCESS_TOKEN') {
        delete currentEnv['OPENAI_API_KEY']
      }

      saveGlobalConfig(prev => ({
        ...prev,
        env: currentEnv,
      }))

      setConnectedState({
        provider: selectedProvider,
        authOption: selectedAuthOption,
        envVars,
        baseUrl,
      })

      // Try to fetch models
      const apiKey = envVars[selectedAuthOption?.envVars?.[0]?.name || '']
        || envVars[selectedProvider.envVars?.[0]?.name || '']
        || envVars[selectedAuthOption?.oauth?.tokenEnvVar || '']
        || envVars['OPENAI_API_KEY']
        || envVars['ANTHROPIC_API_KEY']
        || envVars['OPENROUTER_API_KEY']
        || envVars['GROQ_API_KEY']
        || envVars['DEEPSEEK_API_KEY']

      if (selectedAuthOption?.oauth?.tokenEnvVar === 'OPENAI_CODEX_ACCESS_TOKEN') {
        setAvailableModels([
          { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', providerId: 'openai-codex' },
          { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex', providerId: 'openai-codex' },
          { id: 'gpt-5.2-codex-pro', name: 'GPT-5.2 Codex Pro', providerId: 'openai-codex' },
          { id: 'gpt-5.2-codex-instant', name: 'GPT-5.2 Codex Instant', providerId: 'openai-codex' },
          { id: 'gpt-5.2-codex-thinking', name: 'GPT-5.2 Codex Thinking', providerId: 'openai-codex' },
          { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', providerId: 'openai-codex' },
          { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', providerId: 'openai-codex' },
          { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', providerId: 'openai-codex' },
        ])
        setPhase('pick-model')
      } else if (selectedProvider.modelsApi && apiKey) {
        setLoadingModels(true)
        fetchModels(selectedProvider, apiKey, baseUrl)
          .then((models) => {
            if (models.length > 0) {
              setAvailableModels(models)
              setPhase('pick-model')
            } else {
              onDone(
                `Connected to ${chalk.bold(selectedProvider.name)}. Restart session for changes to take effect.`,
                { display: 'system' as CommandResultDisplay },
              )
            }
          })
          .catch(() => {
            onDone(
              `Connected to ${chalk.bold(selectedProvider.name)}. Restart session for changes to take effect.`,
              { display: 'system' as CommandResultDisplay },
            )
          })
          .finally(() => setLoadingModels(false))
      } else {
        onDone(
          `Connected to ${chalk.bold(selectedProvider.name)}. Restart session for changes to take effect.`,
          { display: 'system' as CommandResultDisplay },
        )
      }
    },
    [selectedProvider, selectedAuthOption, onDone],
  )

  const handleModelSelect = useCallback(
    (model: ModelEntry) => {
      if (!connectedState) return
      const config = getGlobalConfig()
      saveGlobalConfig(prev => ({
        ...prev,
        model: model.id,
      }))
      onDone(
        `Connected to ${chalk.bold(connectedState.provider.name)} with model ${chalk.bold(model.name)}. Restart session for changes to take effect.`,
        { display: 'system' as CommandResultDisplay },
      )
    },
    [connectedState, onDone],
  )

  const handleCancel = useCallback(() => {
    onDone('Connect cancelled')
  }, [onDone])

  // Phase 1: pick provider
  if (phase === 'pick-provider') {
    return <ConnectPicker onSelect={handleProviderSelect} onCancel={handleCancel} />
  }

  // Phase 1b: pick auth method
  if (phase === 'pick-auth' && selectedProvider) {
    return (
      <AuthMethodPicker
        provider={selectedProvider}
        onSelect={handleAuthOptionSelect}
        onCancel={handleCancel}
      />
    )
  }

  // Phase 2: enter API keys / OAuth
  if (phase === 'enter-keys' && selectedProvider) {
    return (
      <KeyEntryFlow
        provider={selectedProvider}
        authOption={selectedAuthOption}
        onComplete={handleKeysComplete}
        onCancel={handleCancel}
      />
    )
  }

  // Phase 3: pick model
  if (phase === 'pick-model' && connectedState) {
    return (
      <ModelPicker
        models={availableModels}
        providerName={connectedState.provider.name}
        onSelect={handleModelSelect}
        onCancel={handleCancel}
        onSkip={() => {
          onDone(
            `Connected to ${chalk.bold(connectedState.provider.name)}. Restart session for changes to take effect.`,
            { display: 'system' as CommandResultDisplay },
          )
        }}
      />
    )
  }

  return null
}

export const call = async (
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
): Promise<React.ReactNode> => {
  return <ConnectCommand onDone={onDone} />
}
