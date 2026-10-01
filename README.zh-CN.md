# 0xmason

[English](README.md) | 简体中文

[0xmason.com](https://0xmason.com) 的网站代码。分享 U 卡、全球账户、eSIM 和 AI 工具的实测记录，也是个人项目的入口。

**发现信息过时、链接失效或邀请码不能用？** [提交 issue](https://github.com/masonweb3/0xmason/issues/new?template=content-report.yml)。

技术栈：Next.js App Router、Payload CMS、Supabase Postgres、Cloudflare R2。由 Vercel 从 `main` 部署，GitHub Actions 负责发布检查和数据库迁移。

## 本地开发

需要 Node.js 24 和 PostgreSQL 17 的命令行工具（`initdb`、`pg_ctl`、`psql`、`createdb`）。

```sh
npm ci
cp .env.example .env
# 在 .env 配置自己的 R2 凭证
npm run cms:setup
# 在 .env 设置管理员邮箱和至少 16 位密码
npm run cms:admin
npm run dev
```

后台位于 `/admin`。`npm run cms:admin -- --reset-password` 可重置管理员密码。

## 检查

```sh
npm run lint
npm run typecheck
npm test
npm run check:images
npm run check:privacy
python3 scripts/check-seo.py https://0xmason.com
node scripts/with-ci-env.mjs npm run build
```

CMS 集成测试需要一个可丢弃的本机 PostgreSQL 数据库：

```sh
export CI_DATABASE_URL=postgresql://postgres:ci@127.0.0.1:5432/mason_cms_ci
node scripts/with-ci-env.mjs npm run cms:migrate
node scripts/with-ci-env.mjs npm run test:cms
```

## 复用本项目

文章、媒体和推荐链接保存在私有数据库，不在本仓库中。发布自己的站点前，请在 `src/lib/site.ts`、`src/lib/cdn.ts`、`next.config.ts`、站点文案和 `content/cdn-assets.json` 中换成自己的品牌与 CDN，并给自己的 R2 存储桶配置 CORS。不要向本项目的存储桶写入图片。

## 许可

网站代码采用 MIT 许可。文章、头像、品牌标识、第三方商标及 CDN 图片不包含在代码许可中；本仓库中的字体按 `assets/fonts` 内附的许可使用。
