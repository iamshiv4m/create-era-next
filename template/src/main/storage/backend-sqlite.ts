import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import Database, { type Database as BetterDatabase } from 'better-sqlite3'
import { z } from 'zod'
import log from 'electron-log/main'
import type { StorageBackend } from './types.js'
import { runMigrations } from './migrations.js'

const dataDir = app.getPath('userData')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const dbPath = join(dataDir, 'app.db')
const db: BetterDatabase = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

runMigrations(db)

log.info(`[sqlite] opened db at ${dbPath}`)

/**
 * Allow-list of SQL verbs for the `db:*` IPC channels.
 * Renderers should never send arbitrary DDL.
 *
 * For write operations (INSERT/UPDATE/DELETE) prefer defining dedicated IPC
 * channels with zod-validated payloads. This generic surface exists mainly to
 * make prototyping and developer DX pleasant.
 */
const allowedPrefix = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i
const sqlSchema = z
  .string()
  .min(1)
  .max(5000)
  .regex(allowedPrefix, 'Only SELECT/INSERT/UPDATE/DELETE/WITH allowed')
const paramsSchema = z.array(z.unknown()).optional()

function validate(sql: string, params?: unknown[]): void {
  sqlSchema.parse(sql)
  paramsSchema.parse(params)
}

// --- KV table for `store:*` parity ---------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`)

const kvGet = db.prepare<[string], { value: string }>('SELECT value FROM kv WHERE key = ?')
const kvSet = db.prepare<[string, string]>(
  'INSERT INTO kv(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
)
const kvDel = db.prepare<[string]>('DELETE FROM kv WHERE key = ?')
const kvClear = db.prepare('DELETE FROM kv')

export const backend: StorageBackend = {
  get(key) {
    const row = kvGet.get(key)
    if (!row) return undefined
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  },
  set(key, value) {
    kvSet.run(key, JSON.stringify(value))
  },
  delete(key) {
    kvDel.run(key)
  },
  clear() {
    kvClear.run()
  },
  run(sql, params = []) {
    validate(sql, params)
    const stmt = db.prepare(sql)
    const info = stmt.run(...(params as never[]))
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid as number | bigint }
  },
  all(sql, params = []) {
    validate(sql, params)
    return db.prepare(sql).all(...(params as never[]))
  },
  getRow(sql, params = []) {
    validate(sql, params)
    return db.prepare(sql).get(...(params as never[]))
  },
}

export { db as rawDb }
