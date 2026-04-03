import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import { getBlogPostList } from '@/utils/blog';

export default function BlogIndex() {
  const { locale } = useParams<{ locale: string }>();
  const { t, i18n } = useTranslation();
  const posts = getBlogPostList((locale as ContentLocale) ?? 'en');

  return (
    <Page className="c-page">
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
                    {new Date(post.date).toLocaleDateString(i18n.language)}
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
