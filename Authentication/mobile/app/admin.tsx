import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Ionicons } from '@expo/vector-icons';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export default function AdminScreen() {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers(token!);
      setUsers(data.users);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await adminService.updateUserStatus(token!, user.id, !user.is_active);
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to update user');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (loading) return <ActivityIndicator size="large" color="#2347B5" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              {/* Info */}
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[styles.btn, item.is_active ? styles.deactivateBtn : styles.activateBtn]}
              onPress={() => toggleStatus(item)}
            >
              <Text style={styles.btnText}>
                {item.is_active ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  logoutBtn: {
    backgroundColor: '#e53935', borderRadius: 8,
    padding: 8,
  },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2347B5', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  email: { fontSize: 12, color: '#666', marginTop: 2 },
  roleBadge: {
    marginTop: 4, backgroundColor: '#e8eeff',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 10, color: '#2347B5', fontWeight: '600' },
  btn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginLeft: 8,
  },
  activateBtn: { backgroundColor: '#4CAF50' },
  deactivateBtn: { backgroundColor: '#e53935' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});