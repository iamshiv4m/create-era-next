import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import chalk from 'chalk'
import ora from 'ora'
import fse from 'fs-extra'
import { resolveConfig } from './prompts.js'
import { copyTemplate } from './utils/copy.js'
import { applyTokens } from './utils/tokens.js'
import { initGit } from './utils/git.js'
import type { ResolvedConfig, ScaffoldOptions } from './types.js'

export async function run(opts: ScaffoldOptions): Promise<void> {
  console.log()
  console.log(chalk.bold.cyan('  create-era-next'))
  console.log(chalk.dim('  Modern Electron + React + Vite + TypeScript scaffolder'))
  console.log()

  if (!existsSync(opts.templateDir)) {
    throw new Error(
      `Template directory not found: ${opts.templateDir}\n` +
        `If you're running from source, build the CLI first: npm --workspace create-era-next run build`,
    )
  }

  const cfg = await resolveConfig(opts)

  console.log()
  console.log(chalk.dim(`  Target:       ${cfg.targetDir}`))
  console.log(chalk.dim(`  Storage:      ${cfg.storage}`))
  console.log(chalk.dim(`  Package mgr:  ${cfg.packageManager}`))
  console.log(chalk.dim(`  GitHub:       ${cfg.githubOwner}/${cfg.githubRepo}`))
  console.log()

  await copyTemplateStep(cfg)
  await applyTokensStep(cfg)
  await selectStorageStep(cfg)
  await customizePackageJson(cfg)

  if (cfg.git) await initGitStep(cfg)
  if (cfg.install) await installDepsStep(cfg)

  printNextSteps(cfg)
}

async function copyTemplateStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora('Copying template files').start()
  try {
    await copyTemplate(cfg.templateDir, cfg.targetDir, cfg.storage)
    spinner.succeed('Template copied')
  } catch (err) {
    spinner.fail('Failed to copy template')
    throw err
  }
}

async function applyTokensStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora('Applying template tokens').start()
  try {
    await applyTokens(cfg.targetDir, {
      projectName: cfg.projectName,
      githubOwner: cfg.githubOwner,
      githubRepo: cfg.githubRepo,
      authorName: cfg.authorName,
      authorEmail: cfg.authorEmail,
    })
    spinner.succeed('Tokens replaced')
  } catch (err) {
    spinner.fail('Token replacement failed')
    throw err
  }
}

/**
 * Rewrites `src/main/storage/backend.ts` to import the chosen backend,
 * and adjusts `package.json` deps accordingly.
 */
async function selectStorageStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora(`Wiring up ${cfg.storage} storage backend`).start()
  try {
    const backendFile = `${cfg.targetDir}/src/main/storage/backend.ts`
    const importLine =
      cfg.storage === 'sqlite'
        ? `export { backend } from './backend-sqlite.js'\n`
        : `export { backend } from './backend-store.js'\n`
    await fse.writeFile(
      backendFile,
      `/**\n * Storage backend selected at scaffold time by create-era-next.\n * Swap this re-export to switch backends later (see docs/04-storage.md).\n */\n${importLine}`,
      'utf8',
    )

    // Remove the unused backend implementation + adjust deps.
    if (cfg.storage === 'electron-store') {
      await fse.remove(`${cfg.targetDir}/src/main/storage/backend-sqlite.ts`)
      await fse.remove(`${cfg.targetDir}/src/main/storage/migrations.ts`)
      await adjustDeps(cfg, {
        remove: ['better-sqlite3', 'zod'],
        removeDev: ['@electron/rebuild', '@types/better-sqlite3'],
      })
    } else {
      await fse.remove(`${cfg.targetDir}/src/main/storage/backend-store.ts`)
      await adjustDeps(cfg, {
        remove: ['electron-store'],
        addDev: { '@types/better-sqlite3': '^7.6.12' },
      })
    }

    spinner.succeed(`${cfg.storage} backend wired`)
  } catch (err) {
    spinner.fail('Storage wiring failed')
    throw err
  }
}

async function adjustDeps(
  cfg: ResolvedConfig,
  changes: {
    remove?: string[]
    removeDev?: string[]
    addDev?: Record<string, string>
  },
): Promise<void> {
  const pkgPath = `${cfg.targetDir}/package.json`
  const pkg = (await fse.readJSON(pkgPath)) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  for (const r of changes.remove ?? []) delete pkg.dependencies?.[r]
  for (const r of changes.removeDev ?? []) delete pkg.devDependencies?.[r]
  for (const [k, v] of Object.entries(changes.addDev ?? {})) {
    pkg.devDependencies ??= {}
    pkg.devDependencies[k] = v
  }
  // Ensure the correct runtime dep is present.
  pkg.dependencies ??= {}
  if (cfg.storage === 'electron-store') {
    pkg.dependencies['electron-store'] = '^10.0.0'
  } else {
    pkg.dependencies['better-sqlite3'] = '^11.7.0'
  }
  await fse.writeJSON(pkgPath, pkg, { spaces: 2 })
}

async function customizePackageJson(cfg: ResolvedConfig): Promise<void> {
  // No-op hook for future per-choice tweaks; currently all deltas handled in
  // the storage step.
  void cfg
}

async function initGitStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora('Initializing git repository').start()
  try {
    await initGit(cfg.targetDir)
    spinner.succeed('Git initialized')
  } catch (err) {
    spinner.warn('Skipping git init (git not available or failed)')
    if (process.env['DEBUG']) console.error(err)
  }
}

async function installDepsStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora(
    `Installing dependencies with ${cfg.packageManager} (this may take a minute)`,
  ).start()
  const installCmd =
    cfg.packageManager === 'yarn'
      ? ['yarn']
      : cfg.packageManager === 'bun'
        ? ['bun', 'install']
        : [cfg.packageManager, 'install']

  try {
    await new Promise<void>((ok, ko) => {
      const child = spawn(installCmd[0]!, installCmd.slice(1), {
        cwd: cfg.targetDir,
        stdio: process.env['DEBUG'] ? 'inherit' : 'pipe',
      })
      child.on('error', ko)
      child.on('close', (code) =>
        code === 0 ? ok() : ko(new Error(`Install exited with code ${code}`)),
      )
    })
    spinner.succeed('Dependencies installed')
  } catch (err) {
    spinner.fail('Failed to install dependencies')
    throw err
  }
}

function printNextSteps(cfg: ResolvedConfig): void {
  const pm = cfg.packageManager
  const runCmd = pm === 'npm' ? 'npm run' : pm
  const relDir = cfg.targetDir.replace(process.cwd() + '/', '')

  console.log()
  console.log(chalk.green('  ✔  Your project is ready!'))
  console.log()
  console.log(chalk.bold('  Next steps:'))
  console.log()
  console.log(chalk.cyan(`    cd ${relDir}`))
  if (!cfg.install) console.log(chalk.cyan(`    ${pm} install`))
  console.log(chalk.cyan(`    ${runCmd} dev`))
  console.log()
  console.log(chalk.dim('  Useful docs inside the project:'))
  console.log(chalk.dim('    docs/01-getting-started.md'))
  console.log(chalk.dim('    docs/03-ipc.md              — add a typed IPC channel'))
  console.log(chalk.dim('    docs/08-auto-update.md      — ship auto-updates via GitHub Releases'))
  console.log()
}
