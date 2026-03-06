import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes';

export default [
  // Redirect / to /en-GB or /es-VE based on language detection
  // This will be handled in a client-side component or a special route
  index('routes/_index.tsx'),
  route('about', 'routes/about.tsx'),
  route('dataset', 'routes/dataset.tsx'),
  route('auth', 'routes/auth.tsx'),
  route('stores/new', 'routes/stores.new.tsx'),
  route('stores/:id/edit', 'routes/stores.edit.tsx'),

  // Locale-prefixed routes
  layout('routes/locale-layout.tsx', [
    route(':lang', 'routes/_index.tsx'),
    route(':lang/about', 'routes/about.tsx'),
    route(':lang/dataset', 'routes/dataset.tsx'),
    route(':lang/auth', 'routes/auth.tsx'),
    route(':lang/stores/new', 'routes/stores.new.tsx'),
    route(':lang/stores/:id/edit', 'routes/stores.edit.tsx'),
  ]),

  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
