import type { MetaFunction } from 'react-router';

export const BASE_URL = 'https://elguacal.com';

export interface SeoMetaProps {
  description: string;
  image?: string;
  imageAlt?: string;
  locale: string;
  path: string;
  title: string;
  type?: 'website' | 'article';
}

export function getSeoMeta({
  description,
  image = '/og-image.png',
  imageAlt = 'El Guacal — find Venezuelan products near you',
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
    { content: '1200', property: 'og:image:width' },
    { content: '630', property: 'og:image:height' },
    { content: imageAlt, property: 'og:image:alt' },
    { content: type, property: 'og:type' },
    { content: 'summary_large_image', name: 'twitter:card' },
    { content: title, name: 'twitter:title' },
    { content: description, name: 'twitter:description' },
    { content: imageUrl, name: 'twitter:image' },
    { content: imageAlt, name: 'twitter:image:alt' },
    { content: locale.replace('-', '_'), property: 'og:locale' },
    {
      href: url,
      rel: 'canonical',
      tagName: 'link',
    },
  ];
}
