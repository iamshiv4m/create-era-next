# create-era-next

> Modern Electron + React + Vite + TypeScript boilerplate. The **next-generation replacement for `electron-react-boilerplate` (ERB)**.

```bash
npm create era-next@latest my-app
# or
npx create-era-next my-app
```

## What you get

- **Electron 41**, **Vite 7**, **React 19**, **TypeScript 5.9**
- **`electron-vite`** for the main/preload/renderer build (HMR, fast reload)
- **Type-safe IPC** — one contract file, compile-time checks everywhere
- **Storage** — choose at scaffold time: `electron-store` or `better-sqlite3`
- **Axios + TanStack Query v5** with Devtools, interceptors, and example feature
- **Auto-updates** via `electron-updater` + GitHub Releases (release workflow included)
- **Tailwind CSS 4**, **React Router v7 _or_ TanStack Router** (pick when you scaffold), **i18next** (en + hi)
- **Vitest** unit tests + **Playwright** e2e smoke test
- **oxlint** + **oxfmt _or_ Prettier** (pick when you scaffold) + **Husky** + **lint-staged**
- **GitHub Actions**: CI + 3-OS release matrix (macOS / Windows / Linux)

## CLI

```
npx create-era-next <project-name> [options]

Options:
  --storage <kind>       Storage backend: electron-store | sqlite
  --router <kind>        Renderer router: react-router-dom | tanstack-router
  --formatter <kind>     Code formatter: oxfmt | prettier
  --pm <name>            Package manager: npm | pnpm | yarn | bun
  --github-owner <owner> GitHub owner for auto-update publish config
  --github-repo <repo>   GitHub repo name
  --no-git               Skip git initialization
  --no-install           Skip dependency installation
  -y, --yes              Accept defaults, no prompts
  --template <dir>       Path to a local template (developer mode)
  -v, --version          Show version
  -h, --help             Show help
```

## After scaffolding

```bash
cd my-app
npm run dev
```

The generated project ships with a `docs/` folder covering:

- Getting started & architecture
- Adding a typed IPC channel
- Storage (both backends)
- Axios + React Query patterns
- i18n
- Building + packaging
- Auto-update pipeline
- Migration from ERB

## Why `create-era-next`?

| Feature             | `create-era-next`                | ERB        |
| ------------------- | -------------------------------- | ---------- |
| Bundler             | **Vite 7 via electron-vite**     | Webpack 5  |
| Dev HMR             | **< 1s**                         | 10–30s     |
| IPC typing          | **Compile-time safe contract**   | — (manual) |
| Storage             | **electron-store OR SQLite**     | — (DIY)    |
| React Query / Axios | **Pre-wired + Devtools**         | — (DIY)    |
| Auto-update         | **Hook + UI + release workflow** | Partial    |
| i18n                | **i18next (en + hi)**            | —          |
| Testing             | **Vitest + Playwright**          | Jest       |

## License

[MIT](./LICENSE)
