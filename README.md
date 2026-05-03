# create-era-next

> A modern, production-ready Electron + React + TypeScript + Vite boilerplate.
> Built as a CLI scaffolder — the **next-generation replacement for `electron-react-boilerplate` (ERB)**.

[![npm version](https://img.shields.io/npm/v/create-era-next.svg)](https://www.npmjs.com/package/create-era-next)
[![license](https://img.shields.io/npm/l/create-era-next.svg)](LICENSE)
[![node](https://img.shields.io/node/v/create-era-next.svg)](https://nodejs.org)

```bash
# Quick start — scaffold a new Electron app
npm create era-next@latest my-app

# or with npx
npx create-era-next my-app

# or with pnpm / yarn / bun
pnpm create era-next my-app
yarn create era-next my-app
bun create era-next my-app
```

Then:

```bash
cd my-app
npm run dev
```

---

## Why another Electron boilerplate?

`electron-react-boilerplate` (ERB) is fantastic but dated — Webpack, slow HMR, legacy config. `create-era-next` gives you:

| Feature            | `create-era-next`                                                             | ERB                        |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------- |
| Bundler            | **Vite 7** via `electron-vite`                                                | Webpack 5                  |
| Dev server startup | **< 1s**                                                                      | 10-30s                     |
| HMR                | **Instant** (Vite)                                                            | Slow                       |
| Language           | TypeScript 5.9                                                                | TypeScript                 |
| UI                 | **React 19** + Tailwind 4                                                     | React + CSS                |
| Data fetching      | **Axios + TanStack Query v5**                                                 | — (DIY)                    |
| Typed IPC          | **Compile-time safe IPC contract**                                            | — (manual `ipcRenderer.*`) |
| Local storage      | **electron-store OR better-sqlite3**                                          | — (DIY)                    |
| Auto-update        | **electron-updater + GitHub Releases**                                        | Partial                    |
| Router             | **Your choice**: React Router v7 _or_ TanStack Router (hash / `file://` safe) | React Router               |
| i18n               | **i18next (en + hi included)**                                                | —                          |
| Testing            | **Vitest + Playwright**                                                       | Jest                       |
| Lint + format      | **oxlint** + **oxfmt _or_ Prettier** + **Husky**                              | ESLint + Prettier          |
| CI / Release       | **3-OS matrix, signed, GitHub Releases**                                      | Partial                    |

---

## What you get

- **Electron 41** with secure defaults (contextIsolation, no nodeIntegration).
- **Vite 7** via [`electron-vite`](https://electron-vite.org) for main / preload / renderer.
- **React 19** + **TypeScript 5.9** + **Tailwind CSS 4**.
- **Type-safe IPC** — define channels once in `src/shared/ipc-contract.ts`, get autocomplete everywhere.
- **Storage of your choice** at scaffold time: `electron-store` (simple JSON) or `better-sqlite3` (relational).
- **Auto-updates** via `electron-updater` + GitHub Releases, with a working `useUpdater()` hook and toast UI.
- **Axios + TanStack Query v5** pre-wired with interceptors, devtools, and a working example.
- **Renderer router** — pick at scaffold time: **`react-router-dom`** (React Router v7 + `createHashRouter`) or **`@tanstack/react-router`** (typed route tree). The CLI removes the package you did not choose.
- **Code formatter** — **`oxfmt`** or **`prettier`** (lint stays **oxlint** for both).
- **Vitest** unit tests + **Playwright** e2e smoke test.
- **GitHub Actions**: CI (lint + typecheck + test) + Release (build matrix for macOS / Windows / Linux).
- **oxlint** + **oxfmt or Prettier** (formatter of your choice) + **Husky 9** + **lint-staged**.

---

## Documentation

Generated project includes a full `docs/` folder. Highlights:

- [Getting started](./template/docs/01-getting-started.md)
- [Architecture overview](./template/docs/02-architecture.md)
- [Adding a typed IPC channel](./template/docs/03-ipc.md)
- [Storage guide (electron-store & SQLite)](./template/docs/04-storage.md)
- [API data layer (Axios + React Query)](./template/docs/05-api-data.md)
- [Internationalization](./template/docs/06-i18n.md)
- [Build & package](./template/docs/07-build-and-package.md)
- [Auto-update](./template/docs/08-auto-update.md)
- [Publishing this CLI to npm](./template/docs/09-publishing-to-npm.md)
- [Migrating from ERB](./template/docs/10-migration-from-erb.md)

---

## CLI usage

```bash
npx create-era-next <project-name> [options]

Options:
  --storage <kind>    Storage backend: electron-store | sqlite
  --router <kind>     Renderer router: react-router-dom | tanstack-router
  --formatter <kind>  Code formatter: oxfmt | prettier
  --pm <name>         Package manager: npm | pnpm | yarn | bun
  --no-git            Skip git initialization
  --no-install        Skip dependency installation
  --yes               Accept all defaults, no prompts
  -h, --help          Show help
  -v, --version       Show version
```

---

## Contributing

This is a monorepo managed with npm workspaces.

```bash
git clone https://github.com/iamshiv4m/create-era-next
cd create-era-next
npm install
npm run build           # build the CLI
npm run smoke           # run CLI into /tmp to smoke-test
# After editing template TypeScript/CSS, install template deps and run:
# cd template && npm install && npm run format && npm run lint
```

---

## License

[MIT](./LICENSE)
