# 0xmason

English | [简体中文](README.zh-CN.md)

Source code for [0xmason.com](https://0xmason.com): hands-on notes on crypto cards, global bank accounts, eSIMs and AI tools, and a home for personal projects.

**Spotted outdated info, a broken link or an invite code that no longer works?** [Open an issue](https://github.com/masonweb3/0xmason/issues/new?template=content-report.yml).

Built with Next.js (App Router), Payload CMS, Supabase Postgres and Cloudflare R2. Deployed on Vercel from `main`; GitHub Actions runs the release checks and database migrations.

## Local development

Requires Node.js 24 and the PostgreSQL 17 command-line tools (`initdb`, `pg_ctl`, `psql`, `createdb`).

```sh
npm ci
cp .env.example .env
# add your own R2 credentials to .env
npm run cms:setup
# set an admin email and a password of at least 16 characters in .env
npm run cms:admin
npm run dev
```

The admin panel is at `/admin`. Reset the admin password with `npm run cms:admin -- --reset-password`.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run check:images
npm run check:privacy
python3 scripts/check-seo.py https://0xmason.com
node scripts/with-ci-env.mjs npm run build
```

CMS integration tests need a disposable local PostgreSQL database:

```sh
export CI_DATABASE_URL=postgresql://postgres:ci@127.0.0.1:5432/mason_cms_ci
node scripts/with-ci-env.mjs npm run cms:migrate
node scripts/with-ci-env.mjs npm run test:cms
```

## Reusing this project

Articles, media and referral links live in a private database and are not in this repository. Before publishing your own site, replace the brand and CDN in `src/lib/site.ts`, `src/lib/cdn.ts`, `next.config.ts`, the site copy and `content/cdn-assets.json`, and configure CORS on your own R2 bucket. Do not upload images to this project's bucket.

## License

The code is MIT licensed. Articles, the avatar, brand marks, third-party trademarks and CDN images are not covered by the code license. The fonts in `assets/fonts` are used under their bundled licenses.
