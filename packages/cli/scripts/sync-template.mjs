#!/usr/bin/env node
/**
 * Copy the root `template/` folder into this package so `npm pack` /
 * `npm publish` ships it inside the CLI tarball.
 *
 * Runs automatically via the `prebuild` npm script.
 */
import { cp, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliRoot = resolve(__dirname, '..')
const source = resolve(cliRoot, '..', '..', 'template')
const destination = resolve(cliRoot, 'template')

if (!existsSync(source)) {
  console.error(`[sync-template] source not found: ${source}`)
  process.exit(1)
}

const sourceStat = await stat(source)
if (!sourceStat.isDirectory()) {
  console.error(`[sync-template] source is not a directory: ${source}`)
  process.exit(1)
}

await rm(destination, { recursive: true, force: true })
await cp(source, destination, {
  recursive: true,
  filter: (src) => {
    if (src.includes(`${destination}/node_modules`)) return false
    if (src.includes(`${destination}/out`)) return false
    if (src.includes(`${destination}/dist`)) return false
    if (src.includes(`${destination}/release`)) return false
    if (src.endsWith('.DS_Store')) return false
    return true
  },
})
console.log(`[sync-template] copied ${source} → ${destination}`)
