import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import Page from '@/components/page';
import type { ContentLocale } from '@/i18n';
import { getBlogPost } from '@/utils/blog';

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

  // Content is self-authored markdown bundled at build time, not user input
  return (
    <Page className="c-page">
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
