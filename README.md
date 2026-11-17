# Matthew Pearce — Portfolio

A full stack portfolio built as a working product rather than a static page. Every word and image on the public site comes from the database and is managed through a custom admin portal.

**Live:** _coming soon_

## Stack

| Layer           | Choice                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Framework       | Next.js (App Router, Cache Components) · TypeScript                     |
| Styling         | Tailwind CSS                                                            |
| Database        | PostgreSQL on Supabase · Prisma ORM                                     |
| Auth            | Better Auth — GitHub, Google, magic link · role-based access            |
| Media           | Cloudflare R2 (presigned uploads, AVIF/WebP variants, EXIF without GPS) |
| Background jobs | Inngest (media processing, email/SMS queue)                             |
| Email / SMS     | Resend · SMS Portal                                                     |
| Edge            | Vercel hosting · Cloudflare DNS, Turnstile                              |
| Testing         | Vitest · Playwright · GitHub Actions                                    |

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

## Licence

Code is MIT licensed. Written content, photographs and artwork are © Matthew Pearce and not covered by the licence.
