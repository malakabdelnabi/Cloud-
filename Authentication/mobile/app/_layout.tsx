import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';

function getRoleRoute(role?: string) {
  if (role === 'Admin') return '/admin';
  if (role === 'Facility Manager') return '/manager';
  if (role === 'Worker') return '/worker';
  return '/community/submit';
}

function RootContent() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const didRedirectRef = useRef(false);
  const wasAuthedRef = useRef(false);

  useEffect(() => {
    if (isLoading || didRedirectRef.current) return;
    if (user && token) {
      didRedirectRef.current = true;
      router.replace(getRoleRoute(user.role) as any);
    }
  }, [isLoading, user, token, router]);

  useEffect(() => {
    if (isLoading) return;
    const isAuthed = !!(user && token);
    if (wasAuthedRef.current && !isAuthed) {
      router.replace('/');
    }
    wasAuthedRef.current = isAuthed;
  }, [isLoading, user, token, router]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🏛️</Text>
        </View>
        <Text style={styles.appName}>CampusCare</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#2347B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
});
