import { useTranslation } from 'react-i18next';
import { Link, type MetaFunction, useParams } from 'react-router';
import type { Blog, WithContext } from 'schema-dts';
import JsonLd from '@/components/json-ld';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import i18n from '@/i18n/config';
import { getBlogPostList } from '@/utils/blog';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.blog.description', { lng: locale }),
    locale,
    path: `/${locale}/blog`,
    title: i18n.t('seo.blog.title', { lng: locale }),
  });
};

export default function BlogIndex() {
  const { locale } = useParams<{ locale: string }>();
  const { t, i18n: i18nInstance } = useTranslation();
  const posts = getBlogPostList((locale as ContentLocale) ?? 'en');

  const jsonLd: WithContext<Blog> = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      datePublished: post.date,
      description: post.excerpt,
      headline: post.title,
      url: `https://elguacal.com/${locale}/blog/${post.slug}`,
    })),
    description: t('seo.blog.description'),
    inLanguage: locale,
    name: t('pages.blog.title'),
    url: `https://elguacal.com/${locale}/blog`,
  };

  return (
    <Page className="c-page">
      <JsonLd data={jsonLd} />
      <h1 className="c-page__title">{t('pages.blog.title')}</h1>
      {posts.length === 0 ? (
        <p className="c-page__text">{t('pages.blog.noPosts')}</p>
      ) : (
        <ul className="c-blog__list">
          {posts.map((post) => (
            <li key={post.slug} className="c-blog__list-item">
              <Link
                to={`/${locale}/blog/${post.slug}`}
                className="c-blog__link"
              >
                <article className="c-blog__card">
                  <time className="c-blog__date" dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString(
                      i18nInstance.language,
                    )}
                  </time>
                  <h2 className="c-blog__card-title">{post.title}</h2>
                  <p className="c-blog__excerpt">{post.excerpt}</p>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
