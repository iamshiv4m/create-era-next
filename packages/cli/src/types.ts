export type StorageKind = 'electron-store' | 'sqlite'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface ScaffoldOptions {
  projectDirectoryArg: string | undefined
  storage: StorageKind | undefined
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
  packageManager: PackageManager
  githubOwner: string
  githubRepo: string
  git: boolean
  install: boolean
  authorName: string
  authorEmail: string
  templateDir: string
}
