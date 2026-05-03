import fse from 'fs-extra'
import type { StorageKind } from '../types.js'

/**
 * Copy the template directory into `target`, omitting irrelevant files and
 * anything specific to the *other* storage backend.
 *
 * Note: we still copy both `backend-*.ts` files here — the scaffolder's
 * `selectStorageStep` decides which one to delete after token replacement,
 * so users don't accidentally get partial code if they switch backends
 * manually later.
 */
export async function copyTemplate(
  source: string,
  target: string,
  _storage: StorageKind,
): Promise<void> {
  await fse.ensureDir(target)

  await fse.copy(source, target, {
    overwrite: false,
    errorOnExist: false,
    filter: (src) => {
      const rel = src.replace(source, '').replace(/\\/g, '/')
      // Never copy transient output from the maintainer's local dev.
      if (rel.includes('/node_modules')) return false
      if (rel.includes('/out')) return false
      if (rel.includes('/dist')) return false
      if (rel.includes('/release')) return false
      // Applied programmatically in selectRouterStep (not part of the user's tree).
      if (rel.includes('/router-variants/')) return false
      if (rel.includes('/formatter-variants/')) return false
      if (rel.endsWith('.DS_Store')) return false
      return true
    },
  })
}
