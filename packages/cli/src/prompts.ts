import { confirm, input, select } from '@inquirer/prompts'
import { existsSync, readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { detectPackageManager } from './utils/package-manager.js'
import { readGitConfig } from './utils/git.js'
import type { PackageManager, ResolvedConfig, ScaffoldOptions, StorageKind } from './types.js'

const projectNameRegex = /^[a-z0-9][a-z0-9-_]{0,213}$/i

/**
 * Turn an arbitrary directory name into a valid npm package name.
 * Only applied to the *basename* — the target path is preserved verbatim.
 */
function sanitizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
}

function isEmptyDir(dir: string): boolean {
  if (!existsSync(dir)) return true
  const entries = readdirSync(dir)
  return entries.length === 0 || (entries.length === 1 && entries[0] === '.git')
}

export async function resolveConfig(opts: ScaffoldOptions): Promise<ResolvedConfig> {
  const git = readGitConfig()
  const detectedPm = detectPackageManager()

  // --- Project name / target dir -------------------------------------------
  let rawInput = opts.projectDirectoryArg
  if (!rawInput) {
    rawInput = opts.yes
      ? 'my-era-app'
      : await input({
          message: 'Project name (directory):',
          default: 'my-era-app',
          validate: (v) =>
            projectNameRegex.test(sanitizeName(basename(v.trim()))) ||
            'Must be lowercase alphanumerics, hyphens, or underscores.',
        })
  }

  // The argument may be a relative or absolute path; we preserve the path
  // but derive the npm `name` field from the basename only.
  const targetDir = resolve(process.cwd(), rawInput)
  const projectName = sanitizeName(basename(targetDir))
  if (!projectNameRegex.test(projectName)) {
    throw new Error(`Invalid project name derived from "${rawInput}": "${projectName}"`)
  }

  if (!isEmptyDir(targetDir)) {
    if (opts.yes) {
      throw new Error(`Directory "${targetDir}" is not empty; refusing to overwrite.`)
    }
    const proceed = await confirm({
      message: `Directory "${targetDir}" already exists and is not empty. Continue and merge files?`,
      default: false,
    })
    if (!proceed) throw new Error('Aborted by user.')
  }

  // --- Storage choice ------------------------------------------------------
  const storage: StorageKind =
    (opts.storage as StorageKind | undefined) ??
    (opts.yes
      ? 'electron-store'
      : await select({
          message: 'Local storage backend:',
          default: 'electron-store' as StorageKind,
          choices: [
            {
              name: 'electron-store — simple JSON key/value (recommended for settings)',
              value: 'electron-store' as StorageKind,
            },
            {
              name: 'better-sqlite3 — relational DB with migrations + zod-validated queries',
              value: 'sqlite' as StorageKind,
            },
          ],
        }))

  if (storage !== 'electron-store' && storage !== 'sqlite') {
    throw new Error(`Invalid --storage: ${storage}. Use "electron-store" or "sqlite".`)
  }

  // --- Package manager -----------------------------------------------------
  const pm: PackageManager = ((opts.packageManager as PackageManager) ??
    (opts.yes
      ? detectedPm
      : await select({
          message: 'Package manager:',
          default: detectedPm,
          choices: (['npm', 'pnpm', 'yarn', 'bun'] as PackageManager[]).map((n) => ({
            name: n,
            value: n,
          })),
        }))) as PackageManager

  // --- GitHub owner / repo (for auto-updates) ------------------------------
  const githubOwner =
    opts.githubOwner ??
    (opts.yes
      ? git.user || 'your-org'
      : await input({
          message: 'GitHub owner (used in auto-update publish config):',
          default: git.user || 'your-org',
        }))

  const githubRepo =
    opts.githubRepo ??
    (opts.yes
      ? projectName
      : await input({
          message: 'GitHub repo name:',
          default: projectName,
        }))

  return {
    projectName,
    targetDir,
    storage,
    packageManager: pm,
    githubOwner,
    githubRepo,
    git: opts.git,
    install: opts.install,
    authorName: git.name || 'Your Name',
    authorEmail: git.email || 'you@example.com',
    templateDir: opts.templateDir,
  }
}
