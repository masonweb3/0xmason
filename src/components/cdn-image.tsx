import Image, { type ImageProps } from 'next/image';
import { preload as preloadImage } from 'react-dom';
import { assetSources, isWebPImage, type ImageSource } from '@/lib/cdn';

type Props = Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> & { src: string; sources?: ImageSource[] };

export function CDNImage({ src, alt, sources = assetSources(src), sizes, preload, loading, fetchPriority, ...props }: Props) {
  if (!isWebPImage(src) || sources.some((source) => !isWebPImage(source.src))) {
    throw new Error('Page images must be WebP files on cdn.0xmason.com.');
  }
  const srcSet = [...sources].sort((a, b) => a.width - b.width).map((source) => `${source.src} ${source.width}w`).join(', ') || undefined;
  if (preload) preloadImage(src, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' });
  return <picture>
    {srcSet && <source type="image/webp" srcSet={srcSet} sizes={sizes} />}
    <Image {...props} src={src} alt={alt} sizes={sizes} unoptimized loading={preload ? 'eager' : loading || 'lazy'} fetchPriority={preload ? 'high' : fetchPriority} />
  </picture>;
}
