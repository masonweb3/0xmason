import { CDNImage as Image } from '@/components/cdn-image';
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { FeaturedResources } from "@/components/resource-card";
import { getCategories } from "@/lib/resources";
import { pageMetadata, site } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";
import { assetUrl } from '@/lib/cdn';

export const metadata = { ...pageMetadata({ title: site.title, description: site.description, path: "/" }), title: { absolute: site.title } };

export default async function Home() {
  const categories = await getCategories();
  return (
    <main id="main-content" className="homepage container">
      <StructuredData value={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, alternateName: "0xmason", description: site.description, inLanguage: "zh-CN", publisher: { "@id": `${site.url}/#person` } },
          { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: site.url, image: assetUrl('images/avatar.png'), sameAs: [site.social] },
        ],
      }} />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-kicker">Mason / 独立开发者</p>
          <h1 id="hero-title">把实践，<br />写成有用的记录</h1>
          <p className="hero-description">
            <span>我是 Mason，前产品经理，现在全职开发 AI 产品</span>
            <span>记录 U 卡、全球账户、eSIM 和订阅支付</span>
          </p>
          <a className="primary-button" href="#featured">
            查看精选<ArrowRight size={28} aria-hidden="true" />
          </a>
        </div>
        <div className="portrait">
          <Image
            src={assetUrl('images/avatar.png')}
            alt="Mason 的插画头像，戴像素墨镜，穿橙色衬衫"
            fill
            preload
            sizes="(max-width: 767px) 80vw, 510px"
          />
        </div>
      </section>
      <section className="featured-section" id="featured" aria-labelledby="featured-heading">
        <div className="section-heading"><h2 id="featured-heading">精选资源</h2></div>
        <FeaturedResources categories={categories} />
      </section>
    </main>
  );
}
