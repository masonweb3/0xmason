import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BrandIcon, OfferCard, PostCard } from "@/components/cards";
import { CopyCode } from "@/components/copy-code";
import { getCategories, getResources } from "@/lib/resources";
import { offers } from "@/lib/offers";

// Acceptance page for the design tokens and components. Not linked, not in the sitemap, never indexed.
export const metadata: Metadata = { title: "设计规范验收", robots: { index: false, follow: false } };

const colors = [
  ['bg', '页面背景'], ['bg-subtle', '拼块、卡片底'], ['surface', '浮在拼块上的卡片'], ['fill', '次要按钮、筛选按钮'],
  ['fill-hover', 'fill 悬停'], ['fill-pressed', 'fill 按下、选中'], ['border-subtle', '分隔线'], ['border', '默认描边'],
  ['fg', '正文、标题'], ['fg-secondary', '摘要、说明'], ['fg-tertiary', '日期等元信息'], ['accent', '主按钮底'],
  ['accent-subtle', '胜出高亮底'], ['on-accent-subtle', '胜出高亮字'], ['focus-ring', '焦点环'], ['danger-text', '风险提示'],
];
const type = [
  ['display', '48 / 1.2 / 600', 'U 卡、全球账户、eSIM'], ['title-1', '36 / 1.35 / 600', 'MEXC 黑卡保姆级开卡教程'], ['title-2', '28 / 1.4 / 600', '卡片速查'],
  ['title-3', '20 / 1.5 / 600', 'Gate U 卡实测'], ['body-lg', '17 / 1.8', '每张卡都自己开过、付过账单。'], ['body', '15 / 1.7', '返现起，每月最多 100 USDT。'],
  ['label', '14 / 1.5 / 500', '看开卡教程'], ['caption', '13 / 1.5', '2026-09 · 约 8 分钟'],
] as const;
const figures = [['figure-xl', 64, '$200'], ['figure', 40, '€50'], ['figure-sm', 28, '4%']] as const;
const radii = [['radius-sm', 8], ['radius-md', 14], ['radius-lg', 24], ['radius-full', 999]] as const;
const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96];

export default async function Styleguide() {
  const [categories, resources] = await Promise.all([getCategories(), getResources()]);
  const post = resources[0];
  return (
    <main id="main-content" className="container styleguide">
      <h1>设计规范验收</h1>
      <p className="styleguide-lede">页面上的颜色都读自 CSS 变量，切换深浅主题即可对照两套值。</p>

      <section aria-labelledby="sg-color"><h2 id="sg-color">颜色</h2>
        <div className="sg-swatches">
          {colors.map(([name, usage]) => (
            <div className="sg-swatch" key={name}><span style={{ background: `var(--${name})` }} /><code>--{name}</code><small>{usage}</small></div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sg-type"><h2 id="sg-type">字体</h2>
        {type.map(([name, spec, sample]) => (
          <div className="sg-row" key={name}><code>{name}<small>{spec}</small></code><span className={`sg-type-${name}`}>{sample}</span></div>
        ))}
        {figures.map(([name, size, sample]) => (
          <div className="sg-row" key={name}><code>{name}<small>{size} / tabular-nums</small></code><span className="sg-figure" style={{ fontSize: size }}>{sample}</span></div>
        ))}
        <div className="sg-row"><code>code<small>Geist Mono 14–15 / 500</small></code><span className="sg-code">VFYXVVSOAA 0XMASON</span></div>
      </section>

      <section aria-labelledby="sg-shape"><h2 id="sg-shape">间距、圆角、阴影</h2>
        <div className="sg-spacing">{spacing.map((size) => <span key={size} style={{ width: size }} title={`${size}px`}><small>{size}</small></span>)}</div>
        <div className="sg-boxes">
          {radii.map(([name, radius]) => <div key={name} style={{ borderRadius: radius }}><code>{name}</code></div>)}
          {['sm', 'md', 'lg', 'float'].map((name) => <div key={name} style={{ boxShadow: `var(--shadow-${name})`, background: 'var(--surface)' }}><code>shadow-{name}</code></div>)}
        </div>
      </section>

      <section aria-labelledby="sg-controls"><h2 id="sg-controls">按钮与链接</h2>
        <div className="sg-inline">
          <a className="primary-button" href="#sg-controls">主按钮<ArrowRight size={16} weight="bold" aria-hidden="true" /></a>
          <a className="secondary-button" href="#sg-controls">次按钮</a>
          <a className="round-button" href="#sg-controls" aria-label="箭头按钮"><ArrowRight size={16} weight="bold" aria-hidden="true" /></a>
          <CopyCode code="MWZK02Z" label="示例 邀请码" />
          <CopyCode code="0XMASON" label="示例 优惠码" className="code-button-fill" />
          <Link className="text-link" href="/resources">文字链接</Link>
        </div>
        <nav className="category-nav" aria-label="筛选按钮示例"><a href="#sg-controls" aria-current="page">选中</a><a href="#sg-controls">默认</a></nav>
        <nav className="breadcrumb" aria-label="面包屑示例"><a href="#sg-controls">精选资源</a><span aria-hidden="true">/</span><a href="#sg-controls">账户与支付</a></nav>
        <p className="disclosure">推广 · 通过邀请码开卡我可能获得奖励</p>
        <div className="sg-inline">{['saily', 'xesim', 'dito', 'csl', 'claude', 'chatgpt'].map((name) => <BrandIcon name={name} size={40} alt={name} key={name} />)}</div>
      </section>

      <section aria-labelledby="sg-cards"><h2 id="sg-cards">卡片</h2>
        <div className="offer-grid">{offers.map((offer) => <OfferCard offer={offer} key={offer.slug} />)}</div>
        {post && <div className="post-grid"><PostCard post={post} category={categories.find((item) => item.slug === post.category)?.title} /></div>}
      </section>

      <section aria-labelledby="sg-prose"><h2 id="sg-prose">正文</h2>
        <div className="article-prose sg-prose">
          <p>正文 17 / 1.8，行宽 680。<a href="#sg-prose">正文里的链接</a>，<code>inline code</code>。</p>
          <blockquote><p>提示框：要是天天拿它在超市刷微信支付宝买单，建议先别办。</p></blockquote>
          <table><thead><tr><th>项目</th><th>数字</th></tr></thead><tbody><tr><td>原始金额</td><td>982.14 比索</td></tr><tr><td>进卡实扣</td><td>$15.79</td></tr></tbody></table>
        </div>
        <table className="review-table sg-review">
          <thead><tr><td /><th scope="col">Opus 5.5</th><th scope="col">GPT-6 Astra</th></tr></thead>
          <tbody><tr><th scope="row">三轮耗时</th><td>4 小时 12 分</td><td className="is-winner">1 小时 9 分</td></tr></tbody>
        </table>
      </section>
    </main>
  );
}
