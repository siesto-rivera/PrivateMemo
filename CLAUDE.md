# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: 지극히 사적인 메모장 (Personal Memo)

A categorized memo app with optional push-alarm dates and tags. Two parallel clients live side-by-side and intentionally mirror each other:

- `class-mobile/` — Expo SDK 54 + Expo Router 6 + NativeWind v4 (Tailwind v3 preset)
- `class-web/` — Next.js 16 (App Router) + Tailwind v4

Both clients implement the same 5 tabs/pages: 홈 / 카테고리 / 추가 / 알림 / 설정. The web client mimics a phone shell (`max-w-md` container + fixed bottom nav) so the visual structure matches mobile.

The user communicates in Korean; reply in Korean by default. Code, identifiers, and shell commands stay in English.

## Common commands

### Mobile (`class-mobile/`)
```bash
npm install
npm start                    # expo start — choose i (iOS) / a (Android) / w (web)
npx tsc --noEmit             # type-check
npm run lint
```

### Web (`class-web/`)
```bash
npm install
npm run dev                  # http://localhost:3000
npm run build                # prerenders the 5 pages statically
npm run lint
```

### npm cache workaround
The system npm cache at `~/.npm/_cacache/` has some root-owned subdirectories that cause `EACCES` errors during install. When installs fail with `EEXIST`/`EACCES` rename errors, prefix commands with a per-user cache:
```bash
NPM_CONFIG_CACHE=/Users/siesto/.npm-claude-cache npm install
```

## Architecture — the load-bearing parts

### Shared data contract, duplicated by design
`lib/mock-data.ts` exists in **both** `class-mobile/` and `class-web/` with identical content:
- `Memo` type — `{ id, category_name, memo, alarm_date?, tag[], createDate }`
- `MOCK_MEMOS` seed array
- `DEFAULT_CATEGORIES` — seed categories only; users can add new ones at runtime via the 카테고리 tab
- `CATEGORY_EMOJI` — emoji per category
- `formatDate(iso)` — `YYYY.MM.DD` formatter

When changing the schema or seed data, **update both copies**. When the backend lands, both clients should converge on a shared client that exposes the same `Memo` type — preserve the type signature so the screens don't need rewriting.

### Styling — two Tailwind versions, one visual language
- Mobile uses **NativeWind v4** which requires **Tailwind v3** (see `class-mobile/tailwind.config.js`).
- Web uses **Tailwind v4** (CSS-first config in `class-web/app/globals.css` via `@theme`).

Both define the same `brand` color scale (`brand-50/100/500/600/700` = violet). When adding tokens, add them to **both** projects so utility class names stay portable. Stick to utilities that exist in both versions — avoid v4-only or NativeWind-only features unless you intentionally diverge.

### Mobile NativeWind plumbing — don't break these
NativeWind v4 needs four files wired together; missing any one silently breaks styling:
- `babel.config.js` — `babel-preset-expo` with `jsxImportSource: 'nativewind'` + `nativewind/babel`
- `metro.config.js` — `withNativeWind(config, { input: './global.css' })`
- `global.css` — Tailwind directives, imported in `app/_layout.tsx`
- `nativewind-env.d.ts` — `className` prop type augmentation

If styles stop applying, clear Metro cache: `npx expo start --clear`.

### Routing
- Mobile: file-based via Expo Router. `app/(tabs)/*.tsx` defines tabs; `app/(tabs)/_layout.tsx` configures the tab bar (icons from `@expo/vector-icons` Ionicons).
- Web: Next.js App Router. Each tab is a folder under `app/` (e.g. `app/categories/page.tsx`). `components/AppShell.tsx` provides the shared header + bottom nav and uses `usePathname()` for active-tab highlighting.

### Path alias
Both projects use `@/*` mapped to project root. So `@/lib/mock-data` and `@/components/...` resolve identically across both.

## Current scope vs. roadmap

UI-only stage: all 5 screens render and interact (search, category add, form input, alarm toggle), but **everything is in-memory mock data**. Saving a memo just shows an alert; no persistence, no real push notifications. Roadmap items in `README.md`: persistence (`expo-sqlite` / `AsyncStorage`), real `expo-notifications` registration, web↔mobile sync.

Don't add backend, persistence, or notification logic unless the user explicitly asks — UI changes can be made directly against the mock data.

## Conventions observed

- Korean UI text in components, English code/identifiers.
- Commit messages: Conventional Commits prefix in English (`docs:`, `chore:`, `feat:`), Korean body. Sign-off via Co-Authored-By when Claude assisted.
- Mobile components use kebab-case filenames (`memo-card.tsx`); web components use PascalCase (`MemoCard.tsx`) — preserve the per-project convention.

## License

CC BY-NC 4.0 — see `LICENSE`. Non-commercial only, attribution required.
