import { spawnSync } from 'node:child_process'

export interface GitConfig {
  name: string | null
  email: string | null
  user: string | null
}

/**
 * Read the current user's global git config for sensible author/owner defaults.
 * Returns nulls for any missing pieces — never throws.
 */
export function readGitConfig(): GitConfig {
  const name = run('git', ['config', '--global', 'user.name'])
  const email = run('git', ['config', '--global', 'user.email'])
  const user = email ? (email.split('@')[0] ?? null) : null
  return { name, email, user }
}

/**
 * `git init` + initial commit inside `dir`.
 */
export async function initGit(dir: string): Promise<void> {
  const ok1 = spawnSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  if (ok1.status !== 0) throw new Error('git init failed')
  spawnSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  const commit = spawnSync(
    'git',
    ['commit', '-m', 'chore: scaffold with create-era-next', '--no-verify'],
    { cwd: dir, stdio: 'ignore' },
  )
  if (commit.status !== 0) {
    // A failed commit is non-fatal (e.g. no git user config). Leave the repo
    // initialized so the user can commit later.
  }
}

function run(cmd: string, args: string[]): string | null {
  const result = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  if (result.status !== 0) return null
  const out = result.stdout.trim()
  return out.length > 0 ? out : null
}
