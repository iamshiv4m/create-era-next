/**
 * This file is replaced by the CLI scaffolder based on the storage choice.
 *
 *   --storage electron-store  →  exports the Store backend from ./backend-store.ts
 *   --storage sqlite          →  exports the SQLite backend from ./backend-sqlite.ts
 *
 * The default below targets `electron-store` so this template stays runnable
 * out of the box if someone clones the repo without the CLI.
 */
export { backend } from './backend-store.js'
