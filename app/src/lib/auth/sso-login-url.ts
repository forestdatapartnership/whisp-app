export function ssoLoginUrl(next: string, loginHint?: string) {
  const url = new URL('/auth/sso/login', window.location.origin);
  url.searchParams.set('next', next.startsWith('/') ? next : '/');
  if (loginHint) url.searchParams.set('login_hint', loginHint);
  return url.toString();
}
