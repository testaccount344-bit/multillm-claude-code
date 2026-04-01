/**
 * Polyfill for bun:bundle compiler builtin.
 * bun:bundle provides the `feature()` function for feature flags.
 * On Windows, the builtin causes stack overflow — this shim replaces it.
 *
 * Usage: import { feature } from 'bun:bundle'
 * This polyfill maps feature flags to environment variable checks:
 *   feature('FOO_BAR') → !!process.env.CLAUDE_FEATURE_FOO_BAR
 */

const FEATURE_ENV_PREFIX = 'CLAUDE_FEATURE_'

export function feature(name: string): boolean {
  // Check explicit env var first
  const envKey = FEATURE_ENV_PREFIX + name.toUpperCase()
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] !== '0' && process.env[envKey] !== '' && process.env[envKey] !== 'false'
  }
  // Default: all features disabled (matches production behavior)
  return false
}
