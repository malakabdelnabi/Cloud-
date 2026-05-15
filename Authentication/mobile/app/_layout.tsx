import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
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
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoImage: { width: 120, height: 120, marginBottom: 16, backgroundColor: 'transparent' },
});
