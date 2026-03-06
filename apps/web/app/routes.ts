import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('about', 'routes/about.tsx'),
  route('dataset', 'routes/dataset.tsx'),
  route('auth', 'routes/auth.tsx'),
  route('stores/new', 'routes/stores.new.tsx'),
  route('stores/:id/edit', 'routes/stores.edit.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
