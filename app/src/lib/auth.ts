// DX-FSM Keycloak Auth
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'dx-fsm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'dx-fsm-frontend',
});

// keycloak-js allows init() only once; share the promise between Login and AuthGuard
let initPromise: Promise<boolean> | null = null;

export const initKeycloak = () => {
  initPromise ??= keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    checkLoginIframe: false,
    pkceMethod: 'S256',
  });
  return initPromise;
};

// Always return to '/' so AuthGuard (not the Login page) processes the callback
export const login = () => keycloak.login({ redirectUri: window.location.origin + '/' });

export const logout = () => keycloak.logout();

export const getToken = () => keycloak.token;
export const getAccessToken = getToken;

export const ROLES = ['admin', 'manager', 'technician', 'customer'] as const;
export type Role = (typeof ROLES)[number];

// Vai trò chính = vai trò quyền cao nhất trong realm_access.roles; mặc định customer
export const pickRole = (roles: string[] = []): Role => ROLES.find((r) => roles.includes(r)) ?? 'customer';

export const getCurrentUser = () => {
  const t = keycloak.tokenParsed as
    | { preferred_username?: string; email?: string; realm_access?: { roles?: string[] } }
    | undefined;
  const roles = t?.realm_access?.roles ?? [];
  return {
    username: t?.preferred_username ?? '',
    email: t?.email ?? '',
    role: pickRole(roles),
  };
};

export const getRoles = () => pickRole(
  (keycloak.tokenParsed as { realm_access?: { roles?: string[] } } | undefined)?.realm_access?.roles,
);

export const getUserInfo = () => keycloak.loadUserInfo();

export default keycloak;
