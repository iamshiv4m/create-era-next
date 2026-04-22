import { Command } from 'commander'
import chalk from 'chalk'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { run } from './scaffolder.js'
import type { StorageKind } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { name: string; version: string }

async function main() {
  const program = new Command()
    .name(pkg.name)
    .description('Scaffold a modern Electron + React + Vite + TypeScript app.')
    .version(pkg.version, '-v, --version')
    .argument('[project-directory]', 'Directory to create the project in')
    .option('--storage <kind>', 'Storage backend: electron-store | sqlite')
    .option('--pm <name>', 'Package manager: npm | pnpm | yarn | bun')
    .option('--github-owner <owner>', 'GitHub owner for auto-update config')
    .option('--github-repo <repo>', 'GitHub repo for auto-update config')
    .option('--no-git', 'Skip git initialization')
    .option('--no-install', 'Skip dependency installation')
    .option('-y, --yes', 'Accept defaults, no prompts')
    .option('--template <dir>', 'Path to a local template (developer mode)')
    .showHelpAfterError()

  program.parse(process.argv)

  const [projectDirectoryArg] = program.args
  const opts = program.opts<{
    storage?: string
    pm?: string
    githubOwner?: string
    githubRepo?: string
    git: boolean
    install: boolean
    yes?: boolean
    template?: string
  }>()

  const defaultTemplate = resolve(__dirname, '..', 'template')

  await run({
    projectDirectoryArg,
    storage: opts.storage as StorageKind | undefined,
    packageManager: opts.pm,
    githubOwner: opts.githubOwner,
    githubRepo: opts.githubRepo,
    git: opts.git,
    install: opts.install,
    yes: Boolean(opts.yes),
    templateDir: opts.template ?? defaultTemplate,
  })
}

main().catch((err) => {
  console.error(chalk.red('\n  ✖  Scaffolding failed.'))
  console.error(err)
  process.exit(1)
})
