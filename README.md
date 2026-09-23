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
python3 scripts/check-seo.py https://0xmason.com
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

SEO 检查使用 Python 3 标准库，遍历 sitemap 与页面内链，核对 HTTP 状态、唯一标题和摘要、canonical、robots、H1、移动 viewport、锚点、文章与面包屑结构化数据、CDN 图片、404 和旧地址跳转。CI 验证本机隔离构建的禁止收录状态；每次正式发布后再检查线上全部公开页面。可加 `--report qa/seo/review.json` 保存本地结果。

`/sitemap.xml` 只包含正式发布的文章及有文章的分类，并附文章图片和真实更新时间。后台保存草稿不会把预览放进 sitemap。文章正文、JSON-LD、Open Graph 与 sitemap 使用同一个更新时间；数据库没有可靠的首次发布日期时，不使用创建时间或当天日期代替。

正式域名以外的 Vercel 地址、预览、后台和 API 通过 `X-Robots-Tag` 禁止收录。Search Console 使用 `0xmason.com` 的 DNS 网域验证，并提交 `https://0xmason.com/sitemap.xml`；验证记录保留在域名服务商，代码中不需要 Google token 或追踪脚本。提交成功与网页已收录是两个状态，以 Search Console 的网址检查结果为准。

Search Console 的「网页会自动重定向」用于标记跳转来源。HTTP、www 和旧分类路径保留永久跳转，sitemap 与内链只指向最终的 HTTPS 地址；不把这些来源改成重复的 200 页面，也不对预期跳转发起「验证修正」。真正需要处理的是最终页面抓取失败、重定向循环、错误 canonical 或意外 noindex。

## Google AdSense 上线条件

当前未接入 AdSense 或 Analytics。`/about`、`/contact`、`/privacy`、`/terms` 提供作者、联系、数据处理与推荐关系说明，正文与普通页面一样服务端渲染。新增数据源或广告前，同步更新实际数据处理说明。

- 发布前核对金额日期、推荐关系与截图打码。
- 拿到自己的 AdSense publisher ID 后，使用账号提供的真实条目发布根域 `ads.txt` 并在 AdSense 验证。当前保持 404，不发布示例 ID 或他人的 ID。根域与 CheckIP 使用同一账号时按 Google 的域名规则配置；如子域使用独立卖方清单，再配置根域 `subdomain=` 与子域文件。
- 个性化广告面向 EEA、英国、瑞士时，先配置 Google 认证且集成 IAB TCF 的 CMP，验证同意、拒绝及撤回行为。普通提示横幅不替代 CMP。其他地区按适用的 Google 政策配置；隐私页不加载需要同意的广告或消息脚本。
- 广告仅放在审查通过、有实际内容的页面，明确区分广告与正文、推荐入口、导航及操作按钮。不在后台、API、预览、隐私页、错误、加载、空结果或纯导航页面展示广告，不采用要求点击才能使用的设计。
- 不自点广告、不引导「点击支持」、不购买或制造广告点击流量，不在 URL 或广告请求中发送邮箱、证件、卡号等身份信息。接入时验收移动端遮挡、布局位移、脚本加载和同意前后网络行为。
- 提交 sitemap、技术检查通过与 AdSense 审核通过是不同结果。按 Search Console 和 AdSense 的实际报告处理，不以固定文章数量或流量数字承诺获批。

依据：[重定向与规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)、[Google 发布商政策](https://support.google.com/publisherpolicies/answer/10502938)、[隐私政策必需内容](https://support.google.com/adsense/answer/1348695)、[CMP 要求](https://support.google.com/adsense/answer/13554116)、[ads.txt](https://support.google.com/adsense/answer/12171612)。接入时重新核对最新版本。

## 发布

Vercel 官方 GitHub 集成只构建 `main`，并以三个 Deployment Checks 阻止未通过检查的版本切换域名：`Quality and CMS`、`Secret scan`、`Supabase migration`。前两项检查成功后，GitHub 才执行生产迁移；三项成功且 Vercel 构建就绪后，由 Vercel 发布。`Verify deployment` 工作流等待生产响应中的 `X-Site-Revision` 与已验证提交一致，再检查公开页面、SEO 和后台访问边界。

GitHub `production` environment 仅允许 `main`，只配置 `SUPABASE_DATABASE_URL` secret：专用应用角色的 Supabase **session pooler，5432 端口**连接。迁移工作流不需要 Vercel token、R2 凭证或后台签名密钥。迁移串行执行，失败不会自动回滚数据库。

在 Vercel 连接仓库后，将上面三个同名 GitHub 检查加入项目的 Deployment Checks，目标设为 production、阻止 domain alias。不要移除这些检查后继续自动发布。项目保留自动域名切换，由检查控制放行。

Vercel Production 配置 `MASON_CMS_SECRET`、`MASON_CMS_DATABASE_URL`、`MASON_CMS_ORIGIN`、四个 `MASON_CMS_R2_*` 变量和 `SITE_INDEXING_ENABLED=true`。应用运行使用 transaction pooler 6543；迁移使用 session pooler 5432，保持 TLS 校验。不要把 Supabase `postgres` 管理员密码放进 CI 或应用环境。

迁移由 `src/cms/migrations` 管理，`push` 关闭。不再维护第二套 Supabase SQL 迁移记录。变更表结构时先执行备份，采用兼容当前线上版本的迁移；确认新版本稳定后，再在后续迁移移除旧字段。创建新表的迁移也必须开启 RLS，撤销匿名权限。恢复数据需要使用私有备份，不能用 Git 回滚代替。

项目由 Vercel 官方 GitHub 集成部署，GitHub Actions 负责发布检查和 Supabase 迁移。凭证只保存在本地忽略文件、GitHub environment secrets 和 Vercel 环境变量中，不上传构建产物或环境文件作为 Actions artifact。

## 许可

网站代码采用 MIT 许可。文章、头像、品牌标识、第三方商标及 CDN 图片不包含在代码许可中；本仓库中的字体按 `assets/fonts` 内附的许可使用。请替换这些内容后再发布自己的站点。
