/** Canonical admin auth URLs — use these instead of legacy /admin/login paths. */
export const ADMIN_SIGN_IN_PATH = "/admin/sign-in";
export const ADMIN_FORGOT_PASSWORD_PATH = "/admin/sign-in/forgot";
export const ADMIN_RESET_PASSWORD_PATH = "/admin/reset-password";

const LEGACY_LOGIN = "/admin/login";
const LEGACY_FORGOT = "/admin/login/forgot-password";
const LEGACY_ROOT_FORGOT = "/forgot-password";

export function isAdminAuthPath(pathname: string): boolean {
  return (
    pathname === ADMIN_SIGN_IN_PATH ||
    pathname === ADMIN_FORGOT_PASSWORD_PATH ||
    pathname === ADMIN_RESET_PASSWORD_PATH ||
    pathname === LEGACY_LOGIN ||
    pathname === LEGACY_FORGOT ||
    pathname === LEGACY_ROOT_FORGOT
  );
}

export function resolveLegacyAuthRedirect(pathname: string): string | null {
  if (pathname === LEGACY_LOGIN || pathname === ADMIN_SIGN_IN_PATH) return null;
  if (pathname === LEGACY_FORGOT || pathname === LEGACY_ROOT_FORGOT) {
    return ADMIN_FORGOT_PASSWORD_PATH;
  }
  if (pathname.startsWith(`${LEGACY_LOGIN}/`)) {
    return ADMIN_SIGN_IN_PATH;
  }
  return null;
}
