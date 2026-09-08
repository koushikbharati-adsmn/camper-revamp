# Repository Guide

## Toolchain and Commands

- This is one npm package; use `package-lock.json` and `npm ci` for a clean install.
- The locked Vite version requires Node `^20.19.0 || >=22.12.0`; the repo does not pin Node separately.
- Start development with `npm run dev`; use `npm run preview` only after a build.
- Run `npm run lint` for ESLint. For a focused check, run `npx eslint src/path/to/file.tsx`.
- `npm run build` is the reliable full check: it runs `tsc -b` for the app and Vite config before bundling.
- Do not rely on `npm run typecheck`: the root config contains only project references, so plain `tsc --noEmit` checks no source files. A non-bundling check requires `npx tsc -p tsconfig.app.json --noEmit` and `npx tsc -p tsconfig.node.json --noEmit`.
- No test runner, test script, or test suite is configured.
- `npm run format` writes every TS/TSX file, including generated router output. Prefer `npx prettier --write <touched-files>` and exclude `src/routeTree.gen.ts`.

## Architecture

- `src/main.tsx` is the browser SPA entrypoint and wires theme, tooltips, React Query, TanStack Router, auth-session invalidation, and toasts.
- `src/routes` contains TanStack file routes and most feature UI. `_authenticated/route.tsx` is a pathless auth guard and shared sidebar layout.
- `src/services` owns Axios requests, React Query option factories, mutation hooks, cache invalidation, and API error toasts.
- `src/lib` owns the shared API client, auth session, QueryClient, constants, and utilities. `src/components/ui` contains shadcn/Base UI primitives.
- Use the `@/*` alias for `src/*`; it is configured in both TypeScript and Vite.

## Routing and Data

- Routes are generated from `src/routes` by the TanStack Router Vite plugin. Never edit `src/routeTree.gen.ts`; it is tracked but overwritten by the plugin.
- Route loaders prefetch through the router context's shared QueryClient, and route components consume the same option factories with `useSuspenseQuery`.
- Existing query-key prefixes are uppercase (`ME`, `USERS`, `COACHES`, `WALKTHROUGH`, `WORKSHOPS`); mutations invalidate the matching prefix.
- Router context initially supplies `user: undefined!`; only the authenticated layout loads and returns a real user. Public routes must not assume `context.user` is valid.
- Scroll restoration targets `#app-scroll-container` in the authenticated layout rather than the browser window.

## Environment and Auth

- Runtime API configuration requires `VITE_API_BASE_URL` and `VITE_API_KEY`. The local `.env` is ignored and no `.env.example` is tracked; never print or commit its values.
- `VITE_*` values are bundled into browser code and are not server-side secrets. The API client sends `x-api-key` on every request and a bearer token on authenticated requests.
- The auth token is stored in `localStorage` under `token`. Setting or clearing it invalidates the `ME` query and router; a 401 clears it and re-enters the login redirect flow.

## UI and Documentation

- Tailwind CSS v4 is configured through the Vite plugin and imports in `src/index.css`; there is intentionally no `tailwind.config.*`.
- shadcn configuration is in `components.json` (`base-lyra`, Base UI, CSS variables). Prettier sorts Tailwind classes in `cn` and `cva` calls.
- `README.md` is mostly scaffold text with a malformed trailing heading; trust manifests, config, and source over it for project behavior.
