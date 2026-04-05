import { useLocalStorage } from '@/hooks/use-local-storage';
import { GA_ID, LOCAL_STORAGE_KEY_TRACKING_KEY } from '@/utils/analytics';

export const GoogleTag = () => {
  const [consent] = useLocalStorage(LOCAL_STORAGE_KEY_TRACKING_KEY);

  if (!consent) return null;

  return (
    <>
      <script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        id="google-tag-manager"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: we must provide the script content
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              'ad_storage': '${consent}',
              'ad_user_data': '${consent}',
              'ad_personalization': '${consent}',
              'analytics_storage': '${consent}'
            });
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
};
