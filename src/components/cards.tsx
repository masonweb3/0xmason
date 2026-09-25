import Link from "next/link";
import { ArrowRight, Warning } from "@phosphor-icons/react/dist/ssr";
import { CDNImage as Image } from './cdn-image';
import { CopyCode } from "./copy-code";
import { resourceHref, type Resource } from "@/lib/resources";
import { brandIcon, cardImage, type Offer } from "@/lib/offers";

export function BrandIcon({ name, size, alt = '' }: { name: string; size: number; alt?: string }) {
  return <Image className="brand-icon" src={brandIcon(name)} alt={alt} width={size} height={size} sizes={`${size}px`} />;
}

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="offer-card">
      <div className="offer-render">
        <Image src={cardImage(offer.card)} alt={offer.cardAlt} width={856} height={540} sizes="(max-width: 1099px) 96px, 200px" />
      </div>
      <div className="offer-name">
        <BrandIcon name={offer.brand} size={32} />
        <div>
          <h3>{offer.name}</h3>
          <span className="offer-requirement">{offer.warn && <Warning size={14} aria-hidden="true" />}{offer.requirement}</span>
        </div>
      </div>
      <p className="offer-figure"><span>{offer.figure}</span>{offer.figureNote}</p>
      {offer.promo && <p className="offer-promo">{offer.promo}</p>}
      <p className="offer-perk">{offer.perk}</p>
      <div className="offer-actions">
        <CopyCode code={offer.code} label={`${offer.name} 邀请码`} />
        <Link className="round-button" href={resourceHref({ category: 'global-accounts', slug: offer.slug })} aria-label={`看 ${offer.name} 教程`}><ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

export function PostCard({ post, category }: { post: Resource; category?: string }) {
  return (
    <Link className="post-card" href={resourceHref(post)}>
      {post.cover && <Image src={post.cover.src} sources={post.cover.sources} width={post.cover.width} height={post.cover.height} alt="" sizes="(max-width: 767px) 112px, 384px" />}
      <span className="post-meta">{category}{post.recordedAt && ` · ${post.recordedAt}`}</span>
      <span className="post-title">{post.title}</span>
    </Link>
  );
}
