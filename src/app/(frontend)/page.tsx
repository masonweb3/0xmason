import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CDNImage as Image } from '@/components/cdn-image';
import { CopyCode } from "@/components/copy-code";
import { StructuredData } from "@/components/structured-data";
import { BrandIcon, OfferCard, PostCard } from "@/components/cards";
import { getCategories, getResources, resourceHref } from "@/lib/resources";
import { pageMetadata, site } from "@/lib/site";
import { assetUrl } from '@/lib/cdn';
import { brandNames, esimGuides, esimWall, marquee, offers, saily } from "@/lib/offers";

export const metadata = { ...pageMetadata({ title: site.title, description: site.description, path: "/" }), title: { absolute: site.title } };

const REVIEW_SLUG = 'opus-5-5-vs-gpt-6-astra';
// Numbers from the review article itself; the winner of each row is highlighted.
const reviewRows = [
  { label: '三轮耗时', opus: '4 小时 12 分', astra: '1 小时 9 分', winner: 'astra' },
  { label: '按 API 价折算', opus: '$59.98', astra: '$14.17', winner: 'astra' },
  { label: '5 位朋友盲评', opus: '5 票', astra: '0 票', winner: 'opus' },
];

export default async function Home() {
  const [categories, resources] = await Promise.all([getCategories(), getResources()]);
  const categoryTitle = new Map(categories.map((category) => [category.slug, category.title]));
  const review = resources.find((resource) => resource.slug === REVIEW_SLUG);
  const latest = resources.filter((resource) => resource.slug !== REVIEW_SLUG).slice(0, 6);
  const esimHref = (slug: string) => resourceHref({ category: 'esim', slug });

  return (
    <main id="main-content" className="homepage">
      <StructuredData value={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, alternateName: "0xmason", description: site.description, inLanguage: "zh-CN", publisher: { "@id": `${site.url}/#person` } },
          { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: site.url, image: assetUrl('images/avatar.png'), sameAs: [site.social] },
        ],
      }} />

      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">Mason 的实测笔记</p>
            <h1 id="hero-title">U 卡、全球账户、eSIM 的开卡实测</h1>
            <p className="hero-lede">每张卡都自己开过、付过账单。</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/resources/global-accounts">看开卡实测<ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
              <a className="secondary-button" href="#cards">卡片速查</a>
            </div>
          </div>
          <div className="hero-stage">
            <Image className="hero-card" src={assetUrl('images/home/starryblu-float.png')} alt="Starryblu Saturn 万事达卡" width={810} height={563} preload sizes="(max-width: 767px) 330px, 560px" />
            <div className="stat-chip">
              <span className="stat-figure">$200</span>
              <span className="stat-note">每月用 Starryblu 付 Claude Max</span>
            </div>
          </div>
        </div>
        <div className="marquee" aria-label="站内教程涉及的卡和服务">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy ? true : undefined}>
                {marquee.map(([name, kind]) => <li key={name}>{name}<span>{kind}</span></li>)}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <section className="container home-section" id="cards" aria-labelledby="cards-heading">
        <div className="section-head">
          <h2 id="cards-heading">卡片速查</h2>
          <p>每张卡的返现和优势，点进去是完整的开卡教程。</p>
        </div>
        <div className="offer-grid">
          {offers.map((offer) => (
            <OfferCard offer={offer} key={offer.slug} />
          ))}
        </div>
        <p className="disclosure">推广 · 通过邀请码开卡我可能获得奖励</p>
      </section>

      <section className="container home-section" aria-labelledby="esim-heading">
        <div className="section-head">
          <h2 id="esim-heading">eSIM 速查</h2>
          <p>海外号码的开通、写卡和保号。</p>
        </div>
        <div className="esim-grid">
          <div className="logo-wall" aria-hidden="true">
            {esimWall.map((column, index) => (
              <div key={index}>{column.map((name) => <BrandIcon name={name} size={88} key={name} />)}</div>
            ))}
          </div>
          <div className="esim-list">
            <article className="esim-featured">
              <BrandIcon name="saily" size={28} />
              <div className="esim-featured-main">
                <div>
                  <h3><Link href={esimHref(saily.slug)}>{saily.title}</Link></h3>
                  <p>{saily.note}</p>
                </div>
                <p className="esim-price"><span>{saily.price}</span>{saily.priceNote}</p>
              </div>
              <div className="esim-code">
                <CopyCode code={saily.code} label="Saily 优惠码" className="code-button-fill" />
                <span className="disclosure">推广 · 用优惠码下单我可能获得奖励</span>
              </div>
            </article>
            {esimGuides.map((guide) => (
              <Link className="esim-row" href={esimHref(guide.slug)} key={guide.slug}>
                <span className="esim-row-copy">
                  <span className="esim-logos">{guide.brands.map((name) => <BrandIcon name={name} size={28} alt={brandNames[name]} key={name} />)}</span>
                  <span className="esim-row-title">{guide.title}</span>
                  <span className="esim-row-note">{guide.note}</span>
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!!latest.length && <section className="container home-section" aria-labelledby="latest-heading">
        <div className="section-head section-head-row">
          <h2 id="latest-heading">最新文章</h2>
          <Link className="text-link" href="/resources">全部文章</Link>
        </div>
        <div className="post-grid">
          {latest.map((post) => (
            <PostCard post={post} category={categoryTitle.get(post.category)} key={post.slug} />
          ))}
        </div>
      </section>}

      {review && <section className="container home-section" aria-labelledby="review-heading">
        <div className="section-head section-head-row">
          <h2 id="review-heading">AI 测评</h2>
        </div>
        <article className="review-card">
          {review.cover && <Image src={review.cover.src} sources={review.cover.sources} width={review.cover.width} height={review.cover.height} alt="" sizes="(max-width: 767px) 90vw, 580px" />}
          <div className="review-copy">
            <span className="post-meta">AI 测评{review.recordedAt && ` · ${review.recordedAt}`}</span>
            <h3>{review.title}</h3>
            <table className="review-table">
              <thead><tr><td /><th scope="col">Opus 5.5</th><th scope="col">GPT-6 Astra</th></tr></thead>
              <tbody>
                {reviewRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={row.winner === 'opus' ? 'is-winner' : undefined}>{row.opus}</td>
                    <td className={row.winner === 'astra' ? 'is-winner' : undefined}>{row.astra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link className="text-link" href={resourceHref(review)}>读完整测评和两份订阅的付款方式</Link>
          </div>
        </article>
      </section>}
    </main>
  );
}
