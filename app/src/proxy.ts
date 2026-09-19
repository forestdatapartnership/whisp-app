import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // `auth/` and `internal/` are route handlers reached at fixed URLs (Keycloak
  // callbacks, backend proxies); prefixing them breaks login and analysis.
  matcher: '/((?!auth/|internal/|_next/|_vercel/|.*\\..*).*)',
};
