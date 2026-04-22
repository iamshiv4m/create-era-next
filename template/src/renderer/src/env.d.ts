/// <reference types="vite/client" />

import type { Api } from '../../preload'

/* eslint-disable @typescript-eslint/no-unused-vars -- ambient type augmentations */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_FEATURE_DEVTOOLS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
/* eslint-enable @typescript-eslint/no-unused-vars */

declare global {
  interface Window {
    api: Api
  }
}

export {}
