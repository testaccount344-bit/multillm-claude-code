/**
 * Provider definitions for the /connect command.
 * Based on OpenCode's 75+ provider support.
 * Each provider defines its env vars, config keys, and metadata.
 */

export interface ProviderConfig {
  /** Unique provider ID used in settings */
  id: string
  /** Display name */
  name: string
  /** Short description shown in picker */
  description: string
  /** Environment variables this provider needs */
  envVars: EnvVarDef[]
  /** Optional: custom base URL field */
  hasBaseUrl?: boolean
  /** Optional: auth method type */
  authMethod?: 'apiKey' | 'oauth' | 'deviceCode' | 'bearer'
  /** Optional: auth URL for OAuth/device code flows */
  authUrl?: string
  /** Optional: documentation URL */
  docsUrl?: string
  /** Optional: npm package for AI SDK provider */
  npmPackage?: string
  /** Optional: auth method choices (e.g. API key vs OAuth) */
  authOptions?: AuthOption[]
}

export interface AuthOption {
  id: string
  label: string
  envVars: EnvVarDef[]
  hasBaseUrl?: boolean
  docsUrl?: string
}

export interface EnvVarDef {
  /** Environment variable name */
  name: string
  /** Label shown in UI */
  label: string
  /** Whether this is required */
  required?: boolean
  /** Whether this is a secret (masked input) */
  secret?: boolean
  /** Help text */
  help?: string
}

export const PROVIDERS: ProviderConfig[] = [
  // ─── Popular ───────────────────────────────────────────────
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models (Haiku, Sonnet, Opus)',
    envVars: [
      { name: 'ANTHROPIC_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-5, o-series, Codex',
    authOptions: [
      {
        id: 'api-key',
        label: 'API Key',
        envVars: [
          { name: 'OPENAI_API_KEY', label: 'API Key', required: true, secret: true },
        ],
        hasBaseUrl: true,
        docsUrl: 'https://platform.openai.com/api-keys',
      },
      {
        id: 'codex-oauth',
        label: 'ChatGPT Codex (OAuth)',
        envVars: [],
        docsUrl: 'https://chatgpt.com/codex',
      },
    ],
  },
  {
    id: 'google-vertex',
    name: 'Google Vertex AI',
    description: 'Gemini and partner models via Google Cloud',
    envVars: [
      { name: 'GOOGLE_APPLICATION_CREDENTIALS', label: 'Service Account Key Path', required: false, help: 'Path to service account JSON' },
      { name: 'GOOGLE_CLOUD_PROJECT', label: 'Project ID', required: true },
      { name: 'VERTEX_LOCATION', label: 'Location', required: false, help: 'Defaults to "global"' },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://cloud.google.com/vertex-ai',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified access to 100+ models',
    envVars: [
      { name: 'OPENROUTER_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Reasoner and chat models',
    envVars: [
      { name: 'DEEPSEEK_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://platform.deepseek.com/',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference for Llama, Mixtral, and more',
    envVars: [
      { name: 'GROQ_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: "Grok models from xAI",
    envVars: [
      { name: 'XAI_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://console.x.ai/',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command and Aya models',
    envVars: [
      { name: 'COHERE_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large, Codestral, and more',
    envVars: [
      { name: 'MISTRAL_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },
  {
    id: 'together-ai',
    name: 'Together AI',
    description: 'Open source models at scale',
    envVars: [
      { name: 'TOGETHER_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
  },
  {
    id: 'fireworks-ai',
    name: 'Fireworks AI',
    description: 'Fast inference for open models',
    envVars: [
      { name: 'FIREWORKS_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://app.fireworks.ai/',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    description: 'Lightning-fast inference on WSE-3',
    envVars: [
      { name: 'CEREBRAS_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://inference.cerebras.ai/',
  },
  // ─── Cloud ─────────────────────────────────────────────────
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    description: 'AWS managed AI service',
    envVars: [
      { name: 'AWS_ACCESS_KEY_ID', label: 'AWS Access Key ID', required: false, secret: true },
      { name: 'AWS_SECRET_ACCESS_KEY', label: 'AWS Secret Access Key', required: false, secret: true },
      { name: 'AWS_REGION', label: 'AWS Region', required: false, help: 'e.g. us-east-1' },
      { name: 'AWS_PROFILE', label: 'AWS Profile', required: false, help: 'Named profile from ~/.aws/credentials' },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://aws.amazon.com/bedrock/',
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    description: "OpenAI models via Microsoft Azure",
    envVars: [
      { name: 'AZURE_OPENAI_API_KEY', label: 'API Key', required: true, secret: true },
      { name: 'AZURE_OPENAI_ENDPOINT', label: 'Endpoint', required: true, help: 'e.g. https://RESOURCE_NAME.openai.azure.com/' },
      { name: 'AZURE_OPENAI_API_VERSION', label: 'API Version', required: false, help: 'e.g. 2024-02-01' },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://portal.azure.com/',
  },
  {
    id: 'azure-cognitive',
    name: 'Azure Cognitive Services',
    description: 'OpenAI models via Azure Cognitive Services',
    envVars: [
      { name: 'AZURE_COGNITIVE_SERVICES_KEY', label: 'API Key', required: true, secret: true },
      { name: 'AZURE_COGNITIVE_SERVICES_RESOURCE_NAME', label: 'Resource Name', required: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://portal.azure.com/',
  },
  {
    id: 'google-ai-studio',
    name: 'Google AI Studio',
    description: 'Gemini models via Google AI Studio',
    envVars: [
      { name: 'GOOGLE_GENERATIVE_AI_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  // ─── Subscriptions ─────────────────────────────────────────
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'Use your Copilot subscription (device code)',
    envVars: [],
    authMethod: 'deviceCode',
    authUrl: 'https://github.com/login/device',
    docsUrl: 'https://github.com/features/copilot',
  },
  {
    id: 'gitlab-duo',
    name: 'GitLab Duo',
    description: 'Claude models via GitLab Duo Agent Platform',
    authOptions: [
      {
        id: 'oauth',
        label: 'OAuth (Recommended)',
        envVars: [],
        docsUrl: 'https://gitlab.com/-/user_settings/applications',
      },
      {
        id: 'pat',
        label: 'Personal Access Token',
        envVars: [
          { name: 'GITLAB_TOKEN', label: 'Personal Access Token', required: true, secret: true, help: 'Starts with glpat-' },
          { name: 'GITLAB_INSTANCE_URL', label: 'GitLab Instance URL', required: false, help: 'For self-hosted (default: gitlab.com)' },
        ],
        docsUrl: 'https://gitlab.com/-/user_settings/personal_access_tokens',
      },
    ],
  },
  // ─── Open Source / Local ───────────────────────────────────
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local models running on your machine',
    envVars: [
      { name: 'OLLAMA_HOST', label: 'Ollama Host', required: false, help: 'Defaults to http://127.0.0.1:11434' },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://ollama.com/',
  },
  {
    id: 'ollama-cloud',
    name: 'Ollama Cloud',
    description: 'Managed Ollama inference',
    envVars: [
      { name: 'OLLAMA_CLOUD_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://ollama.com/',
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    description: 'Local models via LM Studio server',
    envVars: [],
    hasBaseUrl: true,
    authMethod: 'apiKey',
    docsUrl: 'https://lmstudio.ai/',
  },
  {
    id: 'llama-cpp',
    name: 'llama.cpp',
    description: 'Local models via llama-server',
    envVars: [],
    hasBaseUrl: true,
    authMethod: 'apiKey',
    docsUrl: 'https://github.com/ggml-org/llama.cpp',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Open models via Inference Providers (17+ providers)',
    envVars: [
      { name: 'HF_TOKEN', label: 'API Token', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://huggingface.co/settings/tokens',
  },
  // ─── Inference Platforms ───────────────────────────────────
  {
    id: 'deepinfra',
    name: 'Deep Infra',
    description: 'Affordable inference for open models',
    envVars: [
      { name: 'DEEPINFRA_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://deepinfra.com/dash',
  },
  {
    id: 'baseten',
    name: 'Baseten',
    description: 'GPU-optimized model inference',
    envVars: [
      { name: 'BASETEN_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://app.baseten.co/',
  },
  {
    id: 'moonshot-ai',
    name: 'Moonshot AI',
    description: 'Kimi K2 and other models',
    envVars: [
      { name: 'MOONSHOT_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://platform.moonshot.ai/console',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    description: 'M2.1 and other models',
    envVars: [
      { name: 'MINIMAX_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://platform.minimax.io/',
  },
  {
    id: 'ionet',
    name: 'IO.NET',
    description: 'Decentralized GPU inference',
    envVars: [
      { name: 'IONET_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://ai.io.net/',
  },
  {
    id: 'cortecs',
    name: 'Cortecs',
    description: 'GPU cloud for AI inference',
    envVars: [
      { name: 'CORTECS_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://cortecs.ai/',
  },
  {
    id: 'firmware',
    name: 'Firmware',
    description: 'AI inference platform',
    envVars: [
      { name: 'FIRMWARE_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://app.firmware.ai/',
  },
  {
    id: 'nebius',
    name: 'Nebius Token Factory',
    description: 'GPU cloud with AI services',
    envVars: [
      { name: 'NEBIUS_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://tokenfactory.nebius.com/',
  },
  {
    id: 'venice-ai',
    name: 'Venice AI',
    description: 'Privacy-focused AI inference',
    envVars: [
      { name: 'VENICE_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://venice.ai/',
  },
  {
    id: 'z-ai',
    name: 'Z.AI',
    description: 'GLM models from Zhipu AI',
    envVars: [
      { name: 'ZHIPU_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://open.bigmodel.cn/',
  },
  {
    id: '302-ai',
    name: '302.AI',
    description: 'Multi-model API gateway',
    envVars: [
      { name: 'AI302_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://302.ai/',
  },
  // ─── Gateways ──────────────────────────────────────────────
  {
    id: 'cloudflare-ai-gateway',
    name: 'Cloudflare AI Gateway',
    description: 'Unified AI gateway with caching and analytics',
    envVars: [
      { name: 'CLOUDFLARE_API_TOKEN', label: 'API Token', required: true, secret: true },
      { name: 'CLOUDFLARE_ACCOUNT_ID', label: 'Account ID', required: true },
      { name: 'CLOUDFLARE_GATEWAY_ID', label: 'Gateway ID', required: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://dash.cloudflare.com/',
  },
  {
    id: 'cloudflare-workers-ai',
    name: 'Cloudflare Workers AI',
    description: 'Run AI models on Cloudflare edge network',
    envVars: [
      { name: 'CLOUDFLARE_API_KEY', label: 'API Key', required: true, secret: true },
      { name: 'CLOUDFLARE_ACCOUNT_ID', label: 'Account ID', required: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://dash.cloudflare.com/',
  },
  {
    id: 'helicone',
    name: 'Helicone',
    description: 'LLM observability gateway with caching',
    envVars: [
      { name: 'HELICONE_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://helicone.ai',
  },
  {
    id: 'vercel-ai-gateway',
    name: 'Vercel AI Gateway',
    description: 'AI gateway with observability and caching',
    envVars: [
      { name: 'VERCEL_AI_GATEWAY_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://vercel.com/docs/ai-gateway',
  },
  // ─── European Cloud ────────────────────────────────────────
  {
    id: 'scaleway',
    name: 'Scaleway',
    description: 'European cloud provider with AI models',
    envVars: [
      { name: 'SCALEWAY_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://console.scaleway.com/',
  },
  {
    id: 'ovhcloud',
    name: 'OVHcloud AI Endpoints',
    description: 'European AI inference service',
    envVars: [
      { name: 'OVHCLOUD_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://labs.ovh.com/',
  },
  {
    id: 'stackit',
    name: 'STACKIT',
    description: 'European sovereign AI inference',
    envVars: [
      { name: 'STACKIT_API_KEY', label: 'API Key', required: true, secret: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://stackit.de/',
  },
  // ─── Enterprise ────────────────────────────────────────────
  {
    id: 'sap-ai-core',
    name: 'SAP AI Core',
    description: 'Enterprise AI via SAP Business Technology Platform',
    envVars: [
      { name: 'SAP_AI_CORE_CLIENT_ID', label: 'Client ID', required: true },
      { name: 'SAP_AI_CORE_CLIENT_SECRET', label: 'Client Secret', required: true, secret: true },
      { name: 'SAP_AI_CORE_URL', label: 'AI Core URL', required: true },
    ],
    authMethod: 'apiKey',
    docsUrl: 'https://help.sap.com/docs/ai-core',
  },
]

/**
 * Get a provider by ID
 */
export function getProviderById(id: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === id)
}

/**
 * Search providers by name or description
 */
export function searchProviders(query: string): ProviderConfig[] {
  const q = query.toLowerCase()
  return PROVIDERS.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q),
  )
}
