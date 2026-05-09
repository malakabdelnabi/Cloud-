import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authService } from '../services/authService';

// Storage helper that works on both web and mobile
const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedToken = await storage.getItem('userToken');
      const storedUser = await storage.getItem('userData');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (credentials: any) => {
    const data = await authService.login(credentials);
    await storage.setItem('userToken', data.token);
    await storage.setItem('userData', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData: any) => {
    const data = await authService.register(userData);
    await storage.setItem('userToken', data.token);
    await storage.setItem('userData', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    await storage.deleteItem('userToken');
    await storage.deleteItem('userData');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await authService.forgotPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
