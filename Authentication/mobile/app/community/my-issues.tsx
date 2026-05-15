import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';

type Ticket = {
  id: string;
  category: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  Pending: { bg: '#FFF4E5', color: '#B26A00', icon: 'time-outline' },
  'In Progress': { bg: '#E3F2FD', color: '#1565C0', icon: 'sync-outline' },
  Resolved: { bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle-outline' },
};

export default function MyIssuesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await ticketService.getMyTickets(token!);
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err?.error || 'Failed to load issues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token])
  );

  const renderItem = ({ item }: { item: Ticket }) => {
    const s = STATUS_STYLES[item.status] || STATUS_STYLES.Pending;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/community/issue/${item.id}` as any)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.category}</Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={12} color={s.color} />
            <Text style={[styles.badgeText, { color: s.color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardBottom}>
          <Ionicons name="calendar-outline" size={12} color="#888" />
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#bbb"
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Issues</Text>
        <Text style={styles.headerSub}>Track your submitted reports</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2347B5" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={36} color="#e53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color="#bbb" />
          <Text style={styles.emptyTitle}>No issues yet</Text>
          <Text style={styles.emptySub}>
            Submit your first issue from the Submit tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={['#2347B5']}
              tintColor="#2347B5"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    backgroundColor: '#2347B5', paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#cfd9f7', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },

  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center' },
  cardDate: { fontSize: 11, color: '#888', marginLeft: 4 },
});
