# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

UIGen is an AI-powered React component generator. The user chats with Claude, which writes JSX files into a **virtual, in-memory file system** (no files are written to disk). Those files are transformed in the browser with `@babel/standalone` and rendered live in an iframe preview.

## Commands

- `npm run setup` — install deps, generate Prisma client, run migrations. Run this once after cloning.
- `npm run dev` — Next.js dev server with Turbopack on http://localhost:3000.
- `npm run dev:daemon` — same, but backgrounded with logs streaming to `logs.txt` (useful when an agent needs to start the server and keep working).
- `npm run build` / `npm start` — production build / serve.
- `npm run lint` — ESLint via `eslint-config-next`.
- `npm test` — Vitest (jsdom env). Run a single file with `npx vitest run path/to/file.test.ts`, or a single test with `npx vitest run -t "test name"`.
- `npm run db:reset` — `prisma migrate reset --force`. Destructive: wipes `prisma/dev.db`.

All `next` scripts are wrapped with `NODE_OPTIONS='--require ./node-compat.cjs'` — see "Node 25 compatibility" below. Do not strip this prefix.

## Architecture

### Virtual file system (the core abstraction)

`src/lib/file-system.ts` defines `VirtualFileSystem`, an in-memory tree of `FileNode`s. It is the single source of truth for the user's "project" — nothing ever touches the OS filesystem.

- The same instance is used both client- and server-side. The client owns it (held in `FileSystemProvider`) and ships its serialized form (`fs.serialize()`) to the server on every chat request.
- The server reconstructs the FS in `src/app/api/chat/route.ts` via `deserializeFromNodes`, passes it to the AI tools, lets the model mutate it during the stream, then persists the result back into `Project.data` (JSON) at `onFinish`.
- Tool calls that mutate the FS are also intercepted on the client through `onToolCall` in `chat-context.tsx` → `handleToolCall` in `file-system-context.tsx`, so the UI updates optimistically as the model streams.

When changing FS behavior, both sides must agree on serialization. Tests live in `src/lib/__tests__/file-system.test.ts`.

### AI tool surface

The model is given exactly two tools (`src/app/api/chat/route.ts`):

- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — `view` / `create` / `str_replace` / `insert` / `undo_edit` (undo is a no-op stub).
- `file_manager` (`src/lib/tools/file-manager.ts`) — `rename` / `delete`.

Each tool closes over the per-request `VirtualFileSystem` instance. The system prompt that drives the model lives in `src/lib/prompts/generation.tsx` — key invariants it enforces: every project has `/App.jsx`, imports use the `@/` alias, styling is Tailwind, no HTML files.

### Provider with no-API-key fallback

`src/lib/provider.ts` exports `getLanguageModel()`. If `ANTHROPIC_API_KEY` is unset or empty, it returns `MockLanguageModel` — a hand-written `LanguageModelV1` impl that fakes a 3-step tool-calling stream and returns one of three hardcoded components (counter / form / card) chosen by keyword-matching the user prompt. The real model is `claude-haiku-4-5`.

The chat route also reduces `maxSteps` (40 → 4) when the mock is active to keep it from looping.

### Live preview pipeline

`src/components/preview/PreviewFrame.tsx` + `src/lib/transform/jsx-transformer.ts`:

1. Pulls every file from the FS.
2. Babel-transforms each `.jsx`/`.tsx` in the browser (`presets: ["react" automatic runtime, "typescript"]`), tracking imports.
3. Builds an importmap and an HTML document, injects it into an iframe via blob URL. Tailwind is loaded via CDN inside that iframe.
4. Missing imports get replaced with a stub `createPlaceholderModule` so a partial project still renders instead of throwing.

### Routes and persistence

- `/` (`src/app/page.tsx`) — anonymous users see the playground; signed-in users redirect to their most recent `Project` (or a freshly created one).
- `/[projectId]` — authed-only project workspace.
- `/api/chat` — the streaming endpoint described above. `maxDuration = 120`.
- Auth: JWT in an httpOnly cookie via `jose`, signed with `JWT_SECRET` (defaults to `"development-secret-key"` in dev). See `src/lib/auth.ts` and `src/middleware.ts` (the middleware only guards `/api/projects` and `/api/filesystem`, neither of which currently exist — keep this in mind before assuming routes are protected).
- Prisma + SQLite at `prisma/dev.db`. `Project.messages` and `Project.data` are stored as JSON strings.
- **Prisma client output is custom**: generated to `src/generated/prisma` (see `prisma/schema.prisma`). Always import via `@/lib/prisma`, never directly from `@prisma/client`.

### Anonymous work handoff

`src/lib/anon-work-tracker.ts` stashes an anonymous user's messages + serialized FS in `sessionStorage` so they aren't lost when the user signs up mid-session. Sign-up/sign-in flows are expected to read this and persist it into a new `Project`.

### Path alias

`@/*` → `src/*` (see `tsconfig.json`). The system prompt instructs the model to use this alias in generated code too, so the in-browser Babel transform must keep resolving it the same way.

## Node 25 compatibility (don't remove)

`node-compat.cjs` deletes `globalThis.localStorage` / `globalThis.sessionStorage` on the server. Node 25 ships experimental Web Storage globals that exist but are non-functional without `--localstorage-file`; libraries that feature-detect via `typeof localStorage !== "undefined"` then crash during SSR. The `NODE_OPTIONS='--require ./node-compat.cjs'` prefix on every `next` script is what keeps SSR working — preserve it on any new scripts that invoke `next`.

## Testing

Vitest with `jsdom`, React plugin, and `vite-tsconfig-paths` (so `@/` resolves in tests). Tests live next to the code in `__tests__/` folders. No global setup file; component tests import `@testing-library/react` directly.
