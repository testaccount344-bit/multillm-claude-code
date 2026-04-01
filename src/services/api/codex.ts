/**
 * ChatGPT Codex API provider.
 * Routes Anthropic-format API calls through the ChatGPT Codex backend.
 * Based on the official Codex CLI OAuth flow.
 */

import { getGlobalConfig } from '../../utils/config.js'

export const CODEX_BASE_URL = 'https://chatgpt.com/backend-api'
export const CODEX_RESPONSES_PATH = '/codex/responses'

interface CodexOAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

/**
 * Check if Codex OAuth is connected
 */
export function isCodexConnected(): boolean {
  const config = getGlobalConfig()
  const env = config.env || {}
  return !!env['OPENAI_CODEX_ACCESS_TOKEN']
}

/**
 * Get the Codex access token
 */
export function getCodexAccessToken(): string | undefined {
  const config = getGlobalConfig()
  const env = config.env || {}
  return env['OPENAI_CODEX_ACCESS_TOKEN']
}

/**
 * Decode JWT to extract claims
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Get the ChatGPT account ID from the access token
 */
export function getCodexAccountId(): string | undefined {
  const token = getCodexAccessToken()
  if (!token) return undefined
  const decoded = decodeJWT(token)
  if (!decoded) return undefined
  // The account ID is at https://api.openai.com/auth.chatgpt_account_id
  const auth = decoded['https://api.openai.com/auth'] as Record<string, string> | undefined
  return auth?.chatgpt_account_id
}

/**
 * Refresh Codex access token using refresh token
 */
export async function refreshCodexToken(): Promise<CodexOAuthTokens | null> {
  const config = getGlobalConfig()
  const env = config.env || {}
  const refreshToken = env['OPENAI_CODEX_REFRESH_TOKEN']
  if (!refreshToken) return null

  try {
    const res = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
      }),
    })

    if (!res.ok) return null
    const json = await res.json() as CodexOAuthTokens
    if (!json.access_token || !json.refresh_token) return null

    // Save refreshed tokens
    const newEnv = { ...env }
    newEnv['OPENAI_CODEX_ACCESS_TOKEN'] = json.access_token
    newEnv['OPENAI_CODEX_REFRESH_TOKEN'] = json.refresh_token
    config.env = newEnv

    return json
  } catch {
    return null
  }
}

/**
 * Transform an Anthropic API URL to a Codex URL
 */
export function rewriteUrlForCodex(url: string): string {
  // Replace /v1/messages with /codex/responses
  return url.replace(/\/v1\/messages.*/, CODEX_RESPONSES_PATH)
}

/**
 * Transform Anthropic request body to Codex format
 */
export function transformRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = { ...body }

  // Map model names
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-20250514': 'gpt-5',
    'claude-sonnet-4-5-20251101': 'gpt-5',
    'claude-opus-4-20250414': 'gpt-5',
    'claude-opus-4-5-20251101': 'gpt-5',
    'claude-haiku-4-20250514': 'gpt-5',
  }

  const originalModel = body.model as string
  if (originalModel && modelMap[originalModel]) {
    transformed.model = modelMap[originalModel]
  }

  // Map system prompt to input format
  if (body.system) {
    const input = body.input as Array<Record<string, unknown>> || []
    // Prepend system as a message
    input.unshift({
      role: 'system',
      content: body.system,
    })
    transformed.input = input
    delete transformed.system
  }

  // Map max_tokens to max_output_tokens
  if (body.max_tokens) {
    transformed.max_output_tokens = body.max_tokens
    delete transformed.max_tokens
  }

  // Map thinking to reasoning
  if (body.thinking) {
    transformed.reasoning = body.thinking
    delete transformed.thinking
  }

  // Map tools format (Anthropic tools -> OpenAI tools)
  if (body.tools && Array.isArray(body.tools)) {
    transformed.tools = (body.tools as Array<Record<string, unknown>>).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.input_schema || { type: 'object', properties: {} },
      },
    }))
  }

  return transformed
}

/**
 * Create Codex API headers
 */
export function createCodexHeaders(
  existingHeaders: Record<string, string>,
  accountId: string,
  accessToken: string,
): Record<string, string> {
  return {
    ...existingHeaders,
    'Authorization': `Bearer ${accessToken}`,
    'chatgpt-account-id': accountId,
    'OpenAI-Beta': 'responses=experimental',
    'originator': 'codex_cli_rs',
    'accept': 'text/event-stream',
  }
}

/**
 * Create a fetch wrapper that routes requests through the Codex backend
 */
export function createCodexFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const accessToken = getCodexAccessToken()
    const accountId = getCodexAccountId()

    if (!accessToken || !accountId) {
      return originalFetch(input, init || {})
    }

    // Only intercept messages endpoint
    if (!url.includes('/v1/messages')) {
      return originalFetch(input, init || {})
    }

    // Rewrite URL
    const codexUrl = `${CODEX_BASE_URL}${CODEX_RESPONSES_PATH}`

    // Transform request body
    let transformedBody = init?.body
    if (init?.body) {
      try {
        const body = JSON.parse(init.body as string)

        // Map model names from external provider format
        // ext/openai-codex/gpt-5.2-codex -> gpt-5.2-codex
        if (body.model && typeof body.model === 'string') {
          if (body.model.startsWith('ext/openai-codex/')) {
            body.model = body.model.replace('ext/openai-codex/', '')
          } else if (body.model.startsWith('ext/')) {
            // Strip ext/ prefix for other providers too
            body.model = body.model.replace(/^ext\/[^\/]+\//, '')
          }
        }

        transformedBody = JSON.stringify(transformRequestBody(body))
      } catch {
        // Pass through if we can't parse
      }
    }

    // Create Codex headers
    const existingHeaders = init?.headers || {}
    const headers: Record<string, string> = {}
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, key) => { headers[key] = value })
    } else if (Array.isArray(existingHeaders)) {
      for (const [k, v] of existingHeaders) { headers[k] = v }
    } else {
      Object.assign(headers, existingHeaders)
    }

    const codexHeaders = createCodexHeaders(headers, accountId, accessToken)

    // Make request
    const response = await originalFetch(codexUrl, {
      ...init,
      method: 'POST',
      headers: codexHeaders,
      body: transformedBody,
    })

    return response
  }
}
