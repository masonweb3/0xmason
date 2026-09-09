# 0xmason

[0xmason.com](https://0xmason.com) 的网站代码。分享账户与支付、eSIM 保号的使用记录，并作为个人项目的入口。

Next.js App Router、React、Payload CMS、Supabase Postgres、Vercel、Cloudflare R2。后台使用 Payload 的文章、草稿、版本、媒体和推荐链接管理。

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

`cms:db` 生成本地签名密钥，并把数据库放在用户目录的 `.local/share/0xmason`；可以用 `MASON_CMS_RUNTIME_DIR` 指定其他目录。数据库只监听 Unix socket。`cms:seed` 只创建两个分类，不写入文章或管理员。

后台位于 `/admin`。公开注册、用户解锁接口和邮件重置均关闭；管理员由本地命令创建，`npm run cms:admin -- --reset-password` 可重置密码并撤销会话。文章保存草稿后可预览，发布后前台才显示。

## 内容与图片

文章、草稿、管理员、推荐链接和媒体记录保存在私有数据库，不随代码发布。`cms` schema 不授予 Supabase 的匿名或登录用户访问权，Payload 服务端以独立应用角色连接，再执行后台权限检查。

图片上传后由应用中的 Sharp 压缩为 WebP、移除元数据并生成多个尺寸，再写入 R2。页面使用 `srcset` 从 `cdn.0xmason.com` 读取，不调用 Cloudflare 图片处理或 Next.js 图片优化服务。favicon 和 Apple touch icon 保留兼容格式。

`content/cdn-assets.json` 只保存已公开的站点素材地址及尺寸，不含原始文件。复用项目时，请在 `src/lib/site.ts`、`src/lib/cdn.ts`、`next.config.ts`、站点文案和素材清单中换成自己的品牌与 CDN，并配置 R2 CORS。不要向本项目的存储桶写入图片。

## 检查

```sh
npm run lint
npm run typecheck
npm test
npm run check:images
npm run check:privacy
node scripts/with-ci-env.mjs npm run build
```

集成测试只接受本机临时数据库 `mason_cms_ci`，检查迁移、后台注册、草稿隔离、发布版本和匿名访问。测试图片在内存中生成，不访问生产数据库或上传 R2。

```sh
# 创建可丢弃的 PostgreSQL 数据库后，提供本机连接
export CI_DATABASE_URL=postgresql://postgres:ci@127.0.0.1:5432/mason_cms_ci
node scripts/with-ci-env.mjs npm run cms:migrate
node scripts/with-ci-env.mjs npm run test:cms
```

GitHub 的 `CI` 工作流执行上述检查、依赖审计和 Gitleaks。外部 PR 不接触生产密钥。Payload 3.88.0 的已知 account-unlock 中危公告通过禁用 `unlock` 权限处理，并纳入集成测试；依赖审计阻止高危和严重漏洞。

## 发布

Vercel 官方 GitHub 集成只构建 `main`，并以三个 Deployment Checks 阻止未通过检查的版本切换域名：`Quality and CMS`、`Secret scan`、`Supabase migration`。前两项检查成功后，GitHub 才执行生产迁移；三项成功且 Vercel 构建就绪后，由 Vercel 发布。`Verify deployment` 工作流等待生产响应中的 `X-Site-Revision` 与已验证提交一致，再检查公开页面、SEO 和后台访问边界。

GitHub `production` environment 仅允许 `main`，只配置 `SUPABASE_DATABASE_URL` secret：专用应用角色的 Supabase **session pooler，5432 端口**连接。迁移工作流不需要 Vercel token、R2 凭证或后台签名密钥。迁移串行执行，失败不会自动回滚数据库。

在 Vercel 连接仓库后，将上面三个同名 GitHub 检查加入项目的 Deployment Checks，目标设为 production、阻止 domain alias。不要移除这些检查后继续自动发布。项目保留自动域名切换，由检查控制放行。

Vercel Production 配置 `MASON_CMS_SECRET`、`MASON_CMS_DATABASE_URL`、`MASON_CMS_ORIGIN`、四个 `MASON_CMS_R2_*` 变量和 `SITE_INDEXING_ENABLED=true`。应用运行使用 transaction pooler 6543；迁移使用 session pooler 5432，保持 TLS 校验。不要把 Supabase `postgres` 管理员密码放进 CI 或应用环境。

迁移由 `src/cms/migrations` 管理，`push` 关闭。不再维护第二套 Supabase SQL 迁移记录。变更表结构时先执行备份，采用兼容当前线上版本的迁移；确认新版本稳定后，再在后续迁移移除旧字段。创建新表的迁移也必须开启 RLS，撤销匿名权限。恢复数据需要使用私有备份，不能用 Git 回滚代替。

项目由 Vercel 官方 GitHub 集成部署，GitHub Actions 负责发布检查和 Supabase 迁移。凭证只保存在本地忽略文件、GitHub environment secrets 和 Vercel 环境变量中，不上传构建产物或环境文件作为 Actions artifact。

## 许可

网站代码采用 MIT 许可。文章、头像、品牌标识、第三方商标及 CDN 图片不包含在代码许可中；本仓库中的字体按 `assets/fonts` 内附的许可使用。请替换这些内容后再发布自己的站点。
