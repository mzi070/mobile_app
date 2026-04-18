import Auth0, { Credentials } from 'react-native-auth0';
import { config } from '../config';

const auth0 = new Auth0({
  domain: config.auth0.domain,
  clientId: config.auth0.clientId,
});

export interface Auth0UserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

// Re-export the library's Credentials type as our public type
export type { Credentials as Auth0Credentials };

export const authService = {
  /**
   * Opens Auth0 Universal Login in a browser tab.
   * Returns the access token and user profile on success.
   */
  login: async (): Promise<{ credentials: Credentials; user: Auth0UserInfo }> => {
    const credentials = await auth0.webAuth.authorize({
      scope: 'openid profile email offline_access',
      audience: config.auth0.audience,
    }) as Credentials;

    const userInfo = await auth0.auth.userInfo({
      token: credentials.accessToken,
    }) as Auth0UserInfo;

    return { credentials, user: userInfo };
  },

  /**
   * Clears the Auth0 session in the browser and local credentials.
   */
  logout: async (): Promise<void> => {
    await auth0.webAuth.clearSession();
  },

  /**
   * Attempts a silent credential refresh using a stored refresh token.
   */
  refreshCredentials: async (): Promise<Credentials | null> => {
    try {
      const credentials = await auth0.credentialsManager.getCredentials() as Credentials;
      return credentials;
    } catch {
      return null;
    }
  },

  /**
   * Saves credentials to the Auth0 credentials manager (secure storage).
   */
  saveCredentials: async (credentials: Credentials): Promise<void> => {
    await auth0.credentialsManager.saveCredentials(credentials);
  },

  /**
   * Clears locally stored credentials.
   */
  clearCredentials: async (): Promise<void> => {
    await auth0.credentialsManager.clearCredentials();
  },
};
