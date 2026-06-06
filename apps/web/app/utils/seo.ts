import type { MetaFunction } from 'react-router';

export const BASE_URL = 'https://elguacal.com';

export interface SeoMetaProps {
  description: string;
  image?: string;
  locale: string;
  path: string;
  title: string;
  type?: 'website' | 'article';
}

export function getSeoMeta({
  description,
  image = '/og-image.png', // Placeholder as requested
  locale,
  path,
  title,
  type = 'website',
}: SeoMetaProps): ReturnType<MetaFunction> {
  const url = `${BASE_URL}${path}`;
  const imageUrl = `${BASE_URL}${image}`;

  return [
    { title },
    { content: description, name: 'description' },
    { content: url, property: 'og:url' },
    { content: title, property: 'og:title' },
    { content: description, property: 'og:description' },
    { content: imageUrl, property: 'og:image' },
    { content: type, property: 'og:type' },
    { content: 'summary_large_image', name: 'twitter:card' },
    { content: title, name: 'twitter:title' },
    { content: description, name: 'twitter:description' },
    { content: imageUrl, name: 'twitter:image' },
    { content: locale.replace('-', '_'), property: 'og:locale' },
    // React Router 7's meta descriptor for arbitrary head tags
    // expects attributes spread directly on the object alongside
    // `tagName` — NOT nested under an `attributes` key. Passing
    // `{ tagName: 'link', attributes: { href, rel } }` rendered as
    // a literal `<link attributes="[object Object]">` (different
    // stringification path on server vs client → hydration
    // mismatch). See React Router docs / utils/seo.ts comment trail.
    {
      href: url,
      rel: 'canonical',
      tagName: 'link',
    },
  ];
}
