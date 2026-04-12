import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction, useParams } from 'react-router';
import type { BlogPosting, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import { getBlogPost } from '@/utils/blog';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const { slug, locale = 'en-GB' } = params;
  if (!slug) return [];

  const post = getBlogPost(slug, (locale as ContentLocale) ?? 'en');
  if (!post) return [{ title: 'Post Not Found - El Guacal' }];

  return getSeoMeta({
    description: post.excerpt,
    locale,
    path: `/${locale}/blog/${slug}`,
    title: `${post.title} - El Guacal`,
    type: 'article',
  });
};

export default function BlogPost() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const { t, i18n } = useTranslation();
  const post = slug
    ? getBlogPost(slug, (locale as ContentLocale) ?? 'en')
    : null;

  if (!post) {
    return (
      <Page className="c-page">
        <h1 className="c-page__title">404</h1>
        <p className="c-page__text">{t('common.notFound')}</p>
        <Link to={`/${locale}/blog`} className="c-page__btn">
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
    },
    datePublished: post.date,
    description: post.excerpt,
    headline: post.title,
    inLanguage: locale,
    url: `https://elguacal.com/${locale}/blog/${post.slug}`,
  };

  return (
    <Page className="c-page">
      <JsonLd data={jsonLd} />
      <article className="c-blog__post">
        <header className="c-blog__post-header">
          <Link to={`/${locale}/blog`} className="c-blog__back-link">
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
