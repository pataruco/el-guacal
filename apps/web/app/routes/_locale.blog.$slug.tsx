import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction, useParams } from 'react-router';
import type { BlogPosting, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import { resolveMetaLocale } from '@/i18n/locale';
import { getBlogPost } from '@/utils/blog';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { slug } = params;
  const { contentLocale, i18nLng } = resolveMetaLocale(params.locale);
  if (!slug) return [];

  const post = getBlogPost(slug, contentLocale);
  if (!post) return [{ title: 'Post Not Found — El Guacal' }];

  return getSeoMeta({
    description: post.excerpt,
    imageAlt: post.title,
    locale: i18nLng,
    path: `/${contentLocale}/blog/${slug}`,
    title: `${post.title} — El Guacal`,
    type: 'article',
  });
};

export default function BlogPost() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const { t, i18n } = useTranslation();
  const { contentLocale, i18nLng } = resolveMetaLocale(locale);
  const post = slug ? getBlogPost(slug, contentLocale) : null;

  if (!post) {
    return (
      <Page className="c-page c-page--prose">
        <h1 className="c-page__title">404</h1>
        <p className="c-page__text">{t('common.notFound')}</p>
        <Link to={`/${contentLocale}/blog`} className="c-page__btn">
          {t('pages.blog.backToList')}
        </Link>
      </Page>
    );
  }

  const jsonLd: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    author: {
      '@type': 'Organization',
      name: 'El Guacal',
      url: 'https://elguacal.com',
    },
    dateModified: post.date,
    datePublished: post.date,
    description: post.excerpt,
    headline: post.title,
    image: 'https://elguacal.com/og-image.png',
    inLanguage: i18nLng,
    mainEntityOfPage: `https://elguacal.com/${contentLocale}/blog/${post.slug}`,
    publisher: {
      '@type': 'Organization',
      logo: {
        '@type': 'ImageObject',
        url: 'https://elguacal.com/og-image.png',
      },
      name: 'El Guacal',
    },
    url: `https://elguacal.com/${contentLocale}/blog/${post.slug}`,
  };

  return (
    <Page className="c-page c-page--prose">
      <JsonLd data={jsonLd} />
      <article className="c-blog__post">
        <header className="c-blog__post-header">
          <Link to={`/${contentLocale}/blog`} className="c-blog__back-link">
            &larr; {t('pages.blog.backToList')}
          </Link>
          <h1 className="c-page__title">{post.title}</h1>
          <time className="c-blog__date" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(i18n.language)}
          </time>
        </header>
        <div
          className="c-blog__content"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </Page>
  );
}
