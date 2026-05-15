import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, TextInput, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { managerService, Worker } from '../../services/managerService';

type StatusFilter = 'All' | 'Active' | 'Inactive';
const STATUS_FILTERS: StatusFilter[] = ['All', 'Active', 'Inactive'];

export default function WorkerManagementScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await managerService.getWorkers(token);
      setWorkers(res.workers || []);
    } catch (err: any) {
      setError(err?.error || 'Failed to load workers.');
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

  const counts = useMemo(() => ({
    total: workers.length,
    active: workers.filter((w) => w.is_active).length,
    inactive: workers.filter((w) => !w.is_active).length,
  }), [workers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workers.filter((w) => {
      if (statusFilter === 'Active' && !w.is_active) return false;
      if (statusFilter === 'Inactive' && w.is_active) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q)
      );
    });
  }, [workers, query, statusFilter]);

  const toggleStatus = (worker: Worker) => {
    const nextActive = !worker.is_active;
    const action = nextActive ? 'Activate' : 'Deactivate';
    const consequence = nextActive
      ? `${worker.name} will be available for new ticket assignments again.`
      : `${worker.name} will be hidden from the assignment list. Existing assigned tickets are unaffected.`;

    Alert.alert(
      `${action} this worker?`,
      consequence,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              setTogglingId(worker.id);
              const res = await managerService.setWorkerStatus(token, worker.id, nextActive);
              setWorkers((prev) =>
                prev.map((w) =>
                  w.id === worker.id ? { ...w, is_active: res.worker.is_active } : w,
                ),
              );
            } catch (err: any) {
              Alert.alert(`${action} failed`, err?.error || 'Could not update worker status.');
            } finally {
              setTogglingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Worker }) => {
    const busy = togglingId === item.id;
    const initials = item.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <View style={styles.card}>
        <View style={[styles.avatar, item.is_active ? styles.avatarActive : styles.avatarInactive]}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.workerName} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[
                styles.statusPill,
                item.is_active ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.is_active ? '#2E7D32' : '#9e9e9e' },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: item.is_active ? '#2E7D32' : '#666' },
                ]}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={styles.workerEmail} numberOfLines={1}>
            {item.email}
          </Text>
          {item.created_at ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={11} color="#888" />
              <Text style={styles.metaText}>
                Joined {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.toggleWrap}>
          {busy ? (
            <ActivityIndicator size="small" color="#2347B5" />
          ) : (
            <Switch
              value={item.is_active}
              onValueChange={() => toggleStatus(item)}
              trackColor={{ false: '#cfd6e7', true: '#a8c5a8' }}
              thumbColor={item.is_active ? '#2E7D32' : '#f4f4f4'}
              ios_backgroundColor="#cfd6e7"
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worker Accounts</Text>
        <Text style={styles.headerSub}>Activate or deactivate worker access</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total"    value={counts.total}    color="#2347B5" icon="people-outline" />
        <StatCard label="Active"   value={counts.active}   color="#2E7D32" icon="checkmark-circle-outline" />
        <StatCard label="Inactive" value={counts.inactive} color="#9e9e9e" icon="pause-circle-outline" />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#bbb" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((opt) => {
          const active = opt === statusFilter;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(opt)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
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
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color="#bbb" />
          <Text style={styles.emptyTitle}>No matching workers</Text>
          <Text style={styles.emptySub}>
            Try clearing the filters or pull to refresh.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(w) => w.id}
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2347B5', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerBack: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#cfd9f7', fontSize: 12, marginTop: 2 },

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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e6e9f2',
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#222',
    paddingVertical: 8, marginLeft: 8,
  },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginTop: 10, marginBottom: 4, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#d6dffb',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#2347B5', borderColor: '#2347B5' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#2347B5' },
  filterChipTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },

  list: { padding: 16, paddingTop: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarActive:   { backgroundColor: '#E8F5E9' },
  avatarInactive: { backgroundColor: '#eceff1' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#2347B5' },

  cardBody: { flex: 1, marginLeft: 12 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  workerName: { fontSize: 14, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  workerEmail: { fontSize: 12, color: '#666', marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 10, color: '#888', marginLeft: 4 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  pillActive:   { backgroundColor: '#E8F5E9' },
  pillInactive: { backgroundColor: '#eceff1' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  toggleWrap: {
    marginLeft: 8, minWidth: 50, alignItems: 'center', justifyContent: 'center',
  },
});
