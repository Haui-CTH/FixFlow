// DX-FSM Keycloak Auth
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'dx-fsm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'dx-fsm-frontend',
});

export const initKeycloak = async () => {
  const authenticated = await keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    checkLoginIframe: false,
  });
  return authenticated;
};

export const login = () => keycloak.login();

export const logout = () => keycloak.logout();

export const getToken = () => keycloak.token;

export const getUserInfo = () => keycloak.loadUserInfo();

export default keycloak;
