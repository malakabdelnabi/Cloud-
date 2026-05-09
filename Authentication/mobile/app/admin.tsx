import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';

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

    if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin — User Management</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                            <Text style={styles.role}>{item.role}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.btn, item.is_active ? styles.btnDeactivate : styles.btnActivate]}
                            onPress={() => toggleStatus(item)}
                        >
                            <Text style={styles.btnText}>
                                {item.is_active ? 'Deactivate' : 'Activate'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', marginTop: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold' },
    logout: { color: 'red', fontWeight: 'bold', fontSize: 16 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    email: { color: '#555', marginBottom: 4 },
    role: { color: '#888', textTransform: 'capitalize', fontSize: 14 },
    btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
    btnActivate: { backgroundColor: '#4CAF50' },
    btnDeactivate: { backgroundColor: '#F44336' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});