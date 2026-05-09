import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/issues`;
  }
  return 'http://localhost:3000/api/issues';
};

const API_URL = getBaseUrl();

const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('userToken');
  }
  const SecureStore = await import('expo-secure-store');
  return await SecureStore.getItemAsync('userToken');
};

export const issueService = {
  async submitIssue(issueData: FormData) {
    const token = await getToken();
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: issueData,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getMyIssues() {
    const token = await getToken();
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getIssueById(id: string) {
    const token = await getToken();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },
};