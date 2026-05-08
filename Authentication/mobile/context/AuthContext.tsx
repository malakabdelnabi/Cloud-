import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

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
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
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
    await SecureStore.setItemAsync('userToken', data.token);
    await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData: any) => {
    const data = await authService.register(userData);
    await SecureStore.setItemAsync('userToken', data.token);
    await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
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
