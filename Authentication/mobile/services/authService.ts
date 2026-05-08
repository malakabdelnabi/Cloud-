import Constants from 'expo-constants';

/**
 * Dynamically determine the backend URL.
 * In development, Expo provides the host machine's IP via Constants.
 */
const getBaseUrl = () => {
  // Check if running in development and have a hostUri (IP of the machine running the packager)
  const hostUri = Constants.expoConfig?.hostUri;
  
  if (hostUri) {
    // Extract the IP (ignoring the port provided by hostUri) and use backend port 3000
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/auth`;
  }

  // Fallback for production or when hostUri is not available (like web/simulators)
  return 'http://localhost:3000/api/auth';
};

const API_URL = getBaseUrl();
console.log(`[AuthService] Using API URL: ${API_URL}`);

export const authService = {
  async register(userData: any) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async login(credentials: any) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async resetPassword(resetData: any) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }
};
