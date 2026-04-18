const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'  // Android emulator -> host machine
  : 'https://api.lifeflow.app/api';

export const config = {
  apiBaseUrl: API_BASE_URL,
  auth0: {
    domain: 'your-tenant.auth0.com',
    clientId: 'your-client-id',
    audience: 'https://api.lifeflow.app',
  },
};
