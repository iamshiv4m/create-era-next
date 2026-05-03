import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import chalk from 'chalk'
import ora from 'ora'
import fse from 'fs-extra'
import { resolveConfig } from './prompts.js'
import { copyTemplate } from './utils/copy.js'
import { applyTokens } from './utils/tokens.js'
import { initGit } from './utils/git.js'
import type { ResolvedConfig, RouterKind, ScaffoldOptions } from './types.js'

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
  console.log(chalk.dim(`  Router:       ${cfg.router}`))
  console.log(chalk.dim(`  Formatter:    ${cfg.formatter}`))
  console.log(chalk.dim(`  Package mgr:  ${cfg.packageManager}`))
  console.log(chalk.dim(`  GitHub:       ${cfg.githubOwner}/${cfg.githubRepo}`))
  console.log()

  await copyTemplateStep(cfg)
  await selectRouterStep(cfg)
  await applyTokensStep(cfg)
  await selectStorageStep(cfg)
  await selectFormatterStep(cfg)
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

/**
 * Copies the chosen renderer router implementation from
 * `router-variants/<kind>/` and drops the unused package from `package.json`.
 *
 * Must run **before** `applyTokens` so `{{projectName}}` etc. get replaced in
 * the copied files too.
 */
async function selectRouterStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora(`Wiring router: ${cfg.router}`).start()
  try {
    const variantDir = join(cfg.templateDir, 'router-variants', cfg.router)
    if (!existsSync(variantDir)) {
      throw new Error(`Router variant not found: ${variantDir}`)
    }
    const dst = cfg.targetDir
    const files: [string, string][] = [
      ['main.tsx', join(dst, 'src/renderer/src/main.tsx')],
      ['router.tsx', join(dst, 'src/renderer/src/router.tsx')],
      ['AppLayout.tsx', join(dst, 'src/renderer/src/components/AppLayout.tsx')],
      ['Sidebar.tsx', join(dst, 'src/renderer/src/components/Sidebar.tsx')],
      ['ErrorPage.tsx', join(dst, 'src/renderer/src/components/ErrorPage.tsx')],
    ]
    for (const [name, dest] of files) {
      await fse.copy(join(variantDir, name), dest, { overwrite: true })
    }

    const pkgPath = `${dst}/package.json`
    const pkg = (await fse.readJSON(pkgPath)) as { dependencies?: Record<string, string> }
    pkg.dependencies ??= {}
    trimRouterDeps(pkg.dependencies, cfg.router)
    await fse.writeJSON(pkgPath, pkg, { spaces: 2 })

    spinner.succeed(`Router wired (${cfg.router})`)
  } catch (err) {
    spinner.fail('Router wiring failed')
    throw err
  }
}

function trimRouterDeps(deps: Record<string, string>, keep: RouterKind): void {
  if (keep === 'tanstack-router') {
    delete deps['react-router-dom']
  } else {
    delete deps['@tanstack/react-router']
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

async function selectFormatterStep(cfg: ResolvedConfig): Promise<void> {
  const spinner = ora(`Formatter: ${cfg.formatter}`).start()
  try {
    const dst = cfg.targetDir
    const pkgPath = join(dst, 'package.json')
    const pkg = (await fse.readJSON(pkgPath)) as {
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
      'lint-staged'?: Record<string, string | string[]>
    }
    pkg.devDependencies ??= {}
    pkg.scripts ??= {}

    if (cfg.formatter === 'prettier') {
      delete pkg.devDependencies['oxfmt']
      pkg.devDependencies['prettier'] = '^3.4.2'
      pkg.scripts['format'] = 'prettier --write .'
      pkg.scripts['format:check'] = 'prettier --check .'
      pkg['lint-staged'] = {
        '*.{ts,tsx,js,jsx,mjs,cjs,css,md,json,yaml,yml}': ['prettier --write'],
        '*.{ts,tsx}': ['oxlint --react-plugin --vitest-plugin -c .oxlintrc.json --fix'],
      }
      const variantDir = join(cfg.templateDir, 'formatter-variants', 'prettier')
      if (!existsSync(variantDir)) {
        throw new Error(`Formatter variant not found: ${variantDir}`)
      }
      await fse.copy(join(variantDir, '.prettierrc'), join(dst, '.prettierrc'), {
        overwrite: true,
      })
      await fse.copy(join(variantDir, '.prettierignore'), join(dst, '.prettierignore'), {
        overwrite: true,
      })
      const oxPath = join(dst, '.oxfmtrc.json')
      if (existsSync(oxPath)) await fse.remove(oxPath)
    } else {
      delete pkg.devDependencies['prettier']
      pkg.devDependencies['oxfmt'] = '^0.47.0'
      pkg.scripts['format'] = 'oxfmt .'
      pkg.scripts['format:check'] = 'oxfmt --check .'
      pkg['lint-staged'] = {
        '*.{ts,tsx,js,jsx,mjs,cjs,css}': ['oxfmt'],
        '*.{ts,tsx}': ['oxlint --react-plugin --vitest-plugin -c .oxlintrc.json --fix'],
      }
      for (const f of ['.prettierrc', '.prettierignore'] as const) {
        const p = join(dst, f)
        if (existsSync(p)) await fse.remove(p)
      }
      const oxSrc = join(cfg.templateDir, '.oxfmtrc.json')
      const oxDst = join(dst, '.oxfmtrc.json')
      if (!existsSync(oxDst) && existsSync(oxSrc)) {
        await fse.copy(oxSrc, oxDst, { overwrite: true })
      }
    }

    await fse.writeJSON(pkgPath, pkg, { spaces: 2 })
    spinner.succeed(`Formatter set (${cfg.formatter})`)
  } catch (err) {
    spinner.fail('Formatter wiring failed')
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
  // No-op hook for future per-choice tweaks; storage + router + formatter are
  // handled in their respective steps.
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
