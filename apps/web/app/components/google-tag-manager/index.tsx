import { GTM_ID, LOCAL_STORAGE_KEY_TRACKING_KEY } from '@/utils/analytics';
import { consentBootstrapScript } from './bootstrap';

export const GoogleTagHead = () => {
  return (
    <script
      id="google-tag-manager"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM bootstrap snippet
      dangerouslySetInnerHTML={{
        __html: `
          ${consentBootstrapScript(LOCAL_STORAGE_KEY_TRACKING_KEY)}
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `,
      }}
    />
  );
};

export const GoogleTagBody = () => {
  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
};
