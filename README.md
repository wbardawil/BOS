# BOS — BDS (Business Design Shop)

The Digital Chief of Staff platform: strategy, operating model, and initiatives
as three interconnected vertices, with an AI advisor and approval-gated agents.

- Product spec: [`docs/SPEC.md`](docs/SPEC.md)
- Architecture + build plan: [`docs/TECH-SPEC.md`](docs/TECH-SPEC.md)
- Execution kit: [`docs/KICKOFF-PROMPTS.md`](docs/KICKOFF-PROMPTS.md) · [`BOS-START-HERE.md`](BOS-START-HERE.md)
- Project laws: [`CLAUDE.md`](CLAUDE.md)

## Layout

```
apps/web        Next.js 16 + React 19 + Tailwind 4 + shadcn/ui
packages/*      @bos/methodology · scoring · p2w · ai · agents · db
supabase/       config + migrations (CLI only — never hand-paste SQL)
```

## Commands

```
pnpm install
pnpm dev · pnpm build · pnpm typecheck · pnpm test
pnpm test:rls       # adversarial RLS suite (lands with Prompt 1)
pnpm db:migrate · pnpm db:reset
```
