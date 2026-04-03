import { Navigate } from 'react-router';
import { detectLocale } from '@/i18n';

export default function RootRedirect() {
  const locale = detectLocale();
  return <Navigate to={`/${locale}`} replace />;
}
