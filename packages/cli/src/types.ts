export type StorageKind = 'electron-store' | 'sqlite'

/** Renderer router chosen at scaffold time — unused package is removed from `package.json`. */
export type RouterKind = 'react-router-dom' | 'tanstack-router'

/** Formatter chosen at scaffold time — oxfmt or Prettier (lint stays oxlint). */
export type FormatterKind = 'oxfmt' | 'prettier'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface ScaffoldOptions {
  projectDirectoryArg: string | undefined
  storage: StorageKind | undefined
  router: RouterKind | undefined
  formatter: FormatterKind | undefined
  packageManager: string | undefined
  githubOwner: string | undefined
  githubRepo: string | undefined
  git: boolean
  install: boolean
  yes: boolean
  templateDir: string
}

export interface ResolvedConfig {
  projectName: string
  targetDir: string
  storage: StorageKind
  router: RouterKind
  formatter: FormatterKind
  packageManager: PackageManager
  githubOwner: string
  githubRepo: string
  git: boolean
  install: boolean
  authorName: string
  authorEmail: string
  templateDir: string
}
