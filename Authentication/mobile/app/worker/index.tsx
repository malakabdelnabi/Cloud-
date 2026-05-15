import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { workerService, WorkerTicket } from '../../services/workerService';

type StatusFilter = 'All' | 'Pending' | 'In Progress' | 'Resolved';
const STATUS_OPTIONS: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Resolved'];

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  Pending:       { bg: '#FFF4E5', color: '#B26A00', icon: 'time-outline' },
  'In Progress': { bg: '#E3F2FD', color: '#1565C0', icon: 'sync-outline' },
  Resolved:      { bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle-outline' },
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#6c757d',
  Medium: '#2347B5',
  High: '#e67e22',
  Urgent: '#e53935',
};

export default function WorkerDashboardScreen() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<WorkerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const load = async (isRefresh = false) => {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await workerService.getMyTickets(token);
      setTickets(res.tickets || []);
    } catch (err: any) {
      setError(err?.error || err?.message || 'Failed to load assigned issues.');
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

  const filteredTickets = useMemo(
    () => statusFilter === 'All'
      ? tickets
      : tickets.filter((t) => t.status === statusFilter),
    [tickets, statusFilter]
  );

  const counts = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'Pending').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
  }), [tickets]);

  const renderItem = ({ item }: { item: WorkerTicket }) => {
    const s = STATUS_STYLES[item.status] || STATUS_STYLES.Pending;
    const priorityColor = PRIORITY_COLORS[item.priority] || '#2347B5';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/worker/issue/${item.id}` as any)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleWrap}>
            <Ionicons name="construct-outline" size={14} color="#2347B5" />
            <Text style={styles.cardTitle}>{item.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={12} color={s.color} />
            <Text style={[styles.badgeText, { color: s.color }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color="#888" />
          <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            <Ionicons name="flag-outline" size={12} color={priorityColor} />
            <Text style={[styles.metaText, { color: priorityColor, fontWeight: '700' }]}>
              {item.priority}
            </Text>
          </View>
          <View style={[styles.metaRow, { marginLeft: 12 }]}>
            <Ionicons name="calendar-outline" size={12} color="#888" />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
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
        <Text style={styles.headerHi}>Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
        <Text style={styles.headerTitle}>Assigned Issues</Text>
        <Text style={styles.headerSub}>Your maintenance tasks</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={counts.total} color="#2347B5" icon="albums-outline" />
        <StatCard label="Pending" value={counts.pending} color="#B26A00" icon="time-outline" />
        <StatCard label="Active" value={counts.inProgress} color="#1565C0" icon="sync-outline" />
        <StatCard label="Done" value={counts.resolved} color="#2E7D32" icon="checkmark-circle-outline" />
      </View>

      <View style={styles.filtersWrap}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STATUS_OPTIONS.map((opt) => {
            const active = opt === statusFilter;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatusFilter(opt)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
      ) : filteredTickets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={48} color="#bbb" />
          <Text style={styles.emptyTitle}>No issues assigned</Text>
          <Text style={styles.emptySub}>
            Pull to refresh or check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
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

function StatCard({
  label, value, color, icon,
}: { label: string; value: number; color: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },

  header: {
    backgroundColor: '#2347B5', paddingHorizontal: 20, paddingVertical: 18,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerHi: { fontSize: 12, color: '#cfd9f7' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  headerSub: { fontSize: 12, color: '#cfd9f7', marginTop: 2 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: -10, gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  statLabel: { fontSize: 11, color: '#777', marginTop: 1 },

  filtersWrap: { paddingTop: 12, paddingBottom: 4 },
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: '#666',
    paddingHorizontal: 16, marginTop: 6, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  chipRow: { paddingHorizontal: 12, paddingVertical: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#d6dffb',
    backgroundColor: '#fff', marginHorizontal: 4,
  },
  chipActive: { backgroundColor: '#2347B5', borderColor: '#2347B5' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#2347B5' },
  chipTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },

  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginLeft: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  cardDesc: { fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#777', marginLeft: 4, maxWidth: 140 },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center', marginTop: 6,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f5',
  },
});
