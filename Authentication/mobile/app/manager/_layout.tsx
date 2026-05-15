import React from 'react';
import { Alert } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function ManagerLayout() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2347B5',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e3e8f3',
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Issues',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Workers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
          tabBarIcon: ({ size }) => (
            <Ionicons name="log-out-outline" size={size} color="#e53935" />
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600', color: '#e53935' },
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            confirmLogout();
          },
        }}
      />
      <Tabs.Screen name="issue/[id]" options={{ href: null }} />
      <Tabs.Screen name="manage/[id]" options={{ href: null }} />
    </Tabs>
  );
}
