import type { PackageManager } from '../types.js'

/**
 * Detect which package manager ran us via the npm_config_user_agent env var
 * (set by npm/pnpm/yarn/bun). Falls back to 'npm'.
 */
export function detectPackageManager(): PackageManager {
  const ua = process.env['npm_config_user_agent'] ?? ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}
