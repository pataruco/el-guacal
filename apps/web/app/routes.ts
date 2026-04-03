import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  layout('routes/_locale.tsx', [
    route(':locale', 'routes/_locale._index.tsx'),
    route(':locale/about', 'routes/_locale.about.tsx'),
    route(':locale/blog', 'routes/_locale.blog._index.tsx'),
    route(':locale/blog/:slug', 'routes/_locale.blog.$slug.tsx'),
    route(':locale/dataset', 'routes/_locale.dataset.tsx'),
    route(':locale/auth', 'routes/_locale.auth.tsx'),
    route(':locale/stores/new', 'routes/_locale.stores.new.tsx'),
    route(':locale/stores/:id/edit', 'routes/_locale.stores.edit.tsx'),
  ]),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
