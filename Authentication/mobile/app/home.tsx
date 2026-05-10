import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      await logout();
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome 👋</Text>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/issues')}
        >
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>My Issues</Text>
          <Text style={styles.cardSubtitle}>View and track your submitted issues</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/issues/submit')}
        >
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>Submit Issue</Text>
          <Text style={styles.cardSubtitle}>Report a new problem in your community</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  welcome: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 40 },
  name: { fontSize: 22, fontWeight: '600', color: '#007AFF', marginTop: 5 },
  role: { fontSize: 14, color: '#999', marginBottom: 30 },
  cards: { gap: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  cardSubtitle: { fontSize: 14, color: '#888' },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});