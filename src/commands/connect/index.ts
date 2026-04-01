import type { Command } from '../../commands.js'

const connect = {
  type: 'local-jsx',
  name: 'connect',
  description: 'Connect to an AI provider and configure API keys',
  load: () => import('./connect.js'),
} satisfies Command

export default connect
