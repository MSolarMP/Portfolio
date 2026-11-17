# Matthew Pearce — Portfolio

A full stack portfolio built as a working product rather than a static page. Every word and image on the public site comes from the database and is managed through a custom admin portal.

**Live:** [mattcreates.co.za](https://mattcreates.co.za)

## Stack

| Layer           | Choice                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Framework       | Next.js (App Router, Cache Components) · TypeScript                     |
| Styling         | Tailwind CSS                                                            |
| Database        | PostgreSQL on Supabase · Prisma ORM                                     |
| Auth            | Better Auth — owner-only sign-in (magic link, GitHub)                   |
| Media           | Cloudflare R2 (presigned uploads, AVIF/WebP variants, EXIF without GPS) |
| Background jobs | Next.js `after()`; a durable queue arrives with SMS                     |
| Email / SMS     | Resend · SMS Portal                                                     |
| Edge            | Vercel hosting · Cloudflare DNS, Turnstile                              |
| Testing         | Vitest · GitHub Actions                                                 |

## How content is served

Public pages read from the database inside `'use cache'` functions tagged with `cacheTag()`. Visitors get pre-rendered pages; saving in the admin calls `updateTag()` so only the affected pages refresh. See `src/lib/cache-tags.ts`.

## Getting started

Requirements: Node 22+, a PostgreSQL database (Supabase free tier works).

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and DIRECT_URL at minimum
npm run db:migrate        # create tables
npm run db:seed           # load starter content
npm run dev
```

| Script                                | What it does                                        |
| ------------------------------------- | --------------------------------------------------- |
| `npm run dev`                         | Start the dev server                                |
| `npm run build`                       | Generate the Prisma client and build for production |
| `npm run lint` / `typecheck` / `test` | Quality checks (all run in CI)                      |
| `npm run db:migrate`                  | Create/apply migrations in development              |
| `npm run db:deploy`                   | Apply migrations in production                      |
| `npm run db:seed`                     | Upsert starter content (safe to re-run)             |
| `npm run db:studio`                   | Browse the database                                 |

## Project structure

```
prisma/            schema, migrations, seed
src/app/           routes — public site, /admin, API handlers
src/server/        server-only code: database, auth, services
src/lib/           shared utilities, schemas, cache tags
```

## Architecture

```mermaid
flowchart LR
  V[Browser] --> CF[Cloudflare DNS<br/>DNS only]
  CF --> VC[Vercel · Next.js<br/>region dub1]
  VC -->|Prisma · pooled| DB[(Supabase Postgres<br/>eu-west-1)]
  V -->|presigned upload| R2O[(R2 · private originals)]
  VC --> R2P[(R2 · public variants)]
  VC --> MAIL[Resend]
```

One Next.js app. Public pages render from the database inside cached functions; admin saves refresh only the affected cache tags.

### Key decisions

| Decision                                                                          | Why                                                                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One app (modular monolith), not separate admin/API services                       | One developer, low traffic: one deploy and one auth system. Split when a second app exists.                                                            |
| Supabase as plain Postgres, accessed only through Prisma                          | One typed data path. The public Data API is locked (RLS on, no policies, privileges revoked).                                                          |
| Sign-in is for the owner only (Better Auth: magic link, GitHub; email allow-list) | Visitors never need an account, so no personal data is collected. No passwords stored. Checked in the proxy, the admin layout and every server action. |
| Database-driven content with tag-based caching                                    | Edit without redeploying, yet pages load like a static site and survive a slow database.                                                               |
| Media in Cloudflare R2: private originals, public variants                        | 10 GB free with no egress fees; GPS stripped before anything is public.                                                                                |
| `after()` for background work; a queue only once SMS needs retries                | No infrastructure before a workload needs it.                                                                                                          |
| Migrations run during production builds only                                      | Schema and code ship together; previews never change the live schema. Migrations stay additive.                                                        |
| Functions pinned to `dub1`, next to the database                                  | Saves ~75 ms on every database round trip.                                                                                                             |
| One shared database while pre-launch                                              | No real data yet; revisit before launch.                                                                                                               |

## Licence

Code is MIT licensed. Written content, photographs and artwork are © Matthew Pearce and not covered by the licence.
