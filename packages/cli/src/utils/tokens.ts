import fse from 'fs-extra'
import { join } from 'node:path'

export interface Tokens {
  projectName: string
  githubOwner: string
  githubRepo: string
  authorName: string
  authorEmail: string
}

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.html',
  '.css',
  '.env',
  '.example',
  '.plist',
])

function isTextFile(name: string): boolean {
  for (const ext of TEXT_EXTENSIONS) {
    if (name.endsWith(ext)) return true
  }
  return false
}

export async function applyTokens(dir: string, tokens: Tokens): Promise<void> {
  const entries = await fse.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      await applyTokens(full, tokens)
    } else if (entry.isFile() && isTextFile(entry.name)) {
      const content = await fse.readFile(full, 'utf8')
      const next = content
        .replaceAll('{{projectName}}', tokens.projectName)
        .replaceAll('{{githubOwner}}', tokens.githubOwner)
        .replaceAll('{{githubRepo}}', tokens.githubRepo)
        .replaceAll('{{authorName}}', tokens.authorName)
        .replaceAll('{{authorEmail}}', tokens.authorEmail)
      if (next !== content) await fse.writeFile(full, next, 'utf8')
    }
  }
}
