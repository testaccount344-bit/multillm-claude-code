import type { Command } from '../../commands.js'

const providers = {
  type: 'local-jsx',
  name: 'providers',
  description: 'Manage connected providers and enable/disable models',
  load: () => import('./providers.js'),
} satisfies Command

export default providers
