import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { managerService, ManagerTicket, Worker } from '../../services/managerService';

type StatusFilter = 'All' | 'Pending' | 'In Progress' | 'Resolved';
type CategoryFilter = 'All' | 'Electrical' | 'Plumbing' | 'Cleaning' | 'Furniture';
type DateFilter = 'All' | 'Today' | 'Past 7 days' | 'Past 30 days';

const STATUS_OPTIONS: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Resolved'];
const DATE_OPTIONS: DateFilter[] = ['All', 'Today', 'Past 7 days', 'Past 30 days'];

const CATEGORY_OPTIONS: { key: CategoryFilter; icon: any }[] = [
  { key: 'All', icon: 'apps-outline' },
  { key: 'Electrical', icon: 'flash-outline' },
  { key: 'Plumbing', icon: 'water-outline' },
  { key: 'Cleaning', icon: 'sparkles-outline' },
  { key: 'Furniture', icon: 'bed-outline' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  Pending:       { bg: '#FFF4E5', color: '#B26A00', icon: 'time-outline' },
  'In Progress': { bg: '#E3F2FD', color: '#1565C0', icon: 'sync-outline' },
  Resolved:      { bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle-outline' },
};

function withinDateRange(createdAt: string, range: DateFilter) {
  if (range === 'All') return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (range === 'Today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return created >= start.getTime();
  }
  if (range === 'Past 7 days')  return now - created <= 7 * day;
  if (range === 'Past 30 days') return now - created <= 30 * day;
  return true;
}

export default function ManagerDashboardScreen() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<ManagerTicket[]>([]);
  const [workersById, setWorkersById] = useState<Record<string, Worker>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');

  const load = async (isRefresh = false) => {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      console.log('[ManagerDashboard] role:', user?.role, '| filters:', {
        status: statusFilter, category: categoryFilter,
      });

      const [ticketsRes, workersRes] = await Promise.all([
        managerService.getAllTickets(token, {
          status: statusFilter === 'All' ? undefined : statusFilter,
          category: categoryFilter === 'All' ? undefined : categoryFilter,
        }),
        managerService.getWorkers(token),
      ]);

      console.log(
        '[ManagerDashboard] tickets:', ticketsRes.tickets?.length ?? 0,
        '| workers:', workersRes.workers?.length ?? 0,
      );

      setTickets(ticketsRes.tickets || []);
      const map: Record<string, Worker> = {};
      (workersRes.workers || []).forEach((w) => { map[w.id] = w; });
      setWorkersById(map);
    } catch (err: any) {
      console.log('[ManagerDashboard] load error:', err);
      setError(err?.error || err?.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token, statusFilter, categoryFilter])
  );

  const filteredTickets = useMemo(
    () => tickets.filter((t) => withinDateRange(t.created_at, dateFilter)),
    [tickets, dateFilter]
  );

  const counts = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'Pending').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
  }), [tickets]);

  const renderItem = ({ item }: { item: ManagerTicket }) => {
    const s = STATUS_STYLES[item.status] || STATUS_STYLES.Pending;
    const worker = item.assigned_to ? workersById[item.assigned_to] : null;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/manager/issue/${item.id}` as any)}
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
            <Ionicons name="person-outline" size={12} color="#888" />
            <Text style={styles.metaText}>
              {worker ? worker.name : 'Unassigned'}
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

  const renderChipRow = <T extends string>(
    options: readonly T[],
    selected: T,
    onSelect: (v: T) => void,
    iconMap?: (v: T) => any
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.85}
          >
            {iconMap && (
              <Ionicons
                name={iconMap(opt)}
                size={13}
                color={active ? '#fff' : '#2347B5'}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerHi}>Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
        <Text style={styles.headerTitle}>All Issues</Text>
        <Text style={styles.headerSub}>Manage and assign campus reports</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={counts.total} color="#2347B5" icon="albums-outline" />
        <StatCard label="Pending" value={counts.pending} color="#B26A00" icon="time-outline" />
        <StatCard label="Active" value={counts.inProgress} color="#1565C0" icon="sync-outline" />
        <StatCard label="Done" value={counts.resolved} color="#2E7D32" icon="checkmark-circle-outline" />
      </View>

      <View style={styles.filtersWrap}>
        <Text style={styles.filterLabel}>Status</Text>
        {renderChipRow(STATUS_OPTIONS, statusFilter, setStatusFilter)}

        <Text style={styles.filterLabel}>Category</Text>
        {renderChipRow(
          CATEGORY_OPTIONS.map((c) => c.key) as CategoryFilter[],
          categoryFilter,
          setCategoryFilter,
          (v) => CATEGORY_OPTIONS.find((c) => c.key === v)?.icon
        )}

        <Text style={styles.filterLabel}>Date</Text>
        {renderChipRow(DATE_OPTIONS, dateFilter, setDateFilter)}
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
          <Text style={styles.emptyTitle}>No issues match your filters</Text>
          <Text style={styles.emptySub}>
            Try resetting the filters or pull to refresh.
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
