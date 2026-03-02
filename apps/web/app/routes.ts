import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('about', 'routes/about.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
  route('auth/signup', 'routes/auth.signup.tsx'),
] satisfies RouteConfig;
