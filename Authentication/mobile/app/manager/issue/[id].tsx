import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  TouchableOpacity, SafeAreaView, Modal, FlatList, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { managerService, TicketDetail, Worker } from '../../../services/managerService';

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

export default function ManagerIssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [workerQuery, setWorkerQuery] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const [t, w] = await Promise.all([
        managerService.getTicketById(token, id),
        managerService.getWorkers(token),
      ]);
      setTicket(t.ticket);
      setWorkers(w.workers || []);
    } catch (err: any) {
      setError(err?.error || 'Failed to load issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id, token]);

  const filteredWorkers = useMemo(() => {
    const q = workerQuery.trim().toLowerCase();
    const active = workers.filter((w) => w.is_active);
    if (!q) return active;
    return active.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q),
    );
  }, [workers, workerQuery]);

  const handleAssign = async (worker: Worker) => {
    if (!token || !ticket) return;
    try {
      setAssigning(true);
      const res = await managerService.assignTicket(token, ticket.id, worker.id);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              assigned_to: worker.id,
              status: res.ticket.status,
              worker: { id: worker.id, name: worker.name, email: worker.email },
            }
          : prev,
      );
      setPickerOpen(false);
      setWorkerQuery('');
      Alert.alert('Assigned', `Issue assigned to ${worker.name}.`);
    } catch (err: any) {
      Alert.alert('Assignment failed', err?.error || 'Could not assign this worker.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = () => {
    if (!token || !ticket) return;
    Alert.alert(
      'Delete issue',
      'This permanently removes the ticket and its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await managerService.deleteTicket(token, ticket.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Delete failed', err?.error || 'Could not delete this issue.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2347B5" />
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="warning-outline" size={36} color="#e53935" />
        <Text style={styles.errorText}>{error || 'Issue not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const s = STATUS_STYLES[ticket.status] || STATUS_STYLES.Pending;
  const priorityColor = PRIORITY_COLORS[ticket.priority] || '#2347B5';
  const assignedWorker = ticket.worker;
  const updatedDifferent =
    ticket.updated_at && ticket.updated_at !== ticket.created_at;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <TouchableOpacity
          onPress={() => router.push(`/manager/manage/${ticket.id}` as any)}
          style={styles.headerAction}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {ticket.image_url ? (
          <Image source={{ uri: ticket.image_url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="image-outline" size={48} color="#bbb" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.category}>{ticket.category}</Text>
            <View style={[styles.badge, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={12} color={s.color} />
              <Text style={[styles.badgeText, { color: s.color }]}>
                {ticket.status}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{ticket.description}</Text>

          <TouchableOpacity
            style={styles.manageCta}
            onPress={() => router.push(`/manager/manage/${ticket.id}` as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="options-outline" size={16} color="#2347B5" />
            <Text style={styles.manageCtaText}>Manage status & priority</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#2347B5"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#2347B5" />
              <View style={{ marginLeft: 6, flex: 1 }}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue}>{ticket.location}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={16} color={priorityColor} />
              <View style={{ marginLeft: 6, flex: 1 }}>
                <Text style={styles.metaLabel}>Priority</Text>
                <Text style={[styles.metaValue, { color: priorityColor, fontWeight: '700' }]}>
                  {ticket.priority}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#2347B5" />
              <View style={{ marginLeft: 6, flex: 1 }}>
                <Text style={styles.metaLabel}>Submitted</Text>
                <Text style={styles.metaValue}>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {updatedDifferent ? (
              <View style={styles.metaItem}>
                <Ionicons name="refresh-outline" size={16} color="#2347B5" />
                <View style={{ marginLeft: 6, flex: 1 }}>
                  <Text style={styles.metaLabel}>Updated</Text>
                  <Text style={styles.metaValue}>
                    {new Date(ticket.updated_at!).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {ticket.reporter ? (
            <>
              <Text style={styles.sectionLabel}>Reported by</Text>
              <View style={styles.personRow}>
                <View style={[styles.avatar, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="person-outline" size={18} color="#1565C0" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.personName}>{ticket.reporter.name}</Text>
                  <Text style={styles.personSub}>{ticket.reporter.email}</Text>
                </View>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Assignment</Text>
          {assignedWorker ? (
            <View style={styles.assignedBox}>
              <View style={styles.personRow}>
                <View style={[styles.avatar, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="hammer-outline" size={18} color="#2E7D32" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.personName}>{assignedWorker.name}</Text>
                  <Text style={styles.personSub}>{assignedWorker.email}</Text>
                </View>
                <View style={styles.assignedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                  <Text style={styles.assignedTagText}>Assigned</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.reassignBtn}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color="#2347B5" />
                <Text style={styles.reassignBtnText}>Reassign to another worker</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.unassignedBox}>
              <View style={styles.unassignedRow}>
                <Ionicons name="person-add-outline" size={20} color="#B26A00" />
                <Text style={styles.unassignedText}>
                  No worker assigned yet
                </Text>
              </View>
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="people-outline" size={18} color="#fff" />
                <Text style={styles.assignBtnText}>Assign Worker</Text>
              </TouchableOpacity>
            </View>
          )}

          {ticket.internal_notes ? (
            <>
              <Text style={styles.sectionLabel}>Internal notes</Text>
              <View style={styles.noteBox}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color="#2347B5"
                />
                <Text style={styles.noteText}>{ticket.internal_notes}</Text>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Danger zone</Text>
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete issue</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deleteHint}>
            This permanently removes the ticket and any attached photos.
          </Text>
        </View>
      </ScrollView>

      {/* Worker picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to worker</Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email"
                placeholderTextColor="#aaa"
                value={workerQuery}
                onChangeText={setWorkerQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {workerQuery ? (
                <TouchableOpacity onPress={() => setWorkerQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="#bbb" />
                </TouchableOpacity>
              ) : null}
            </View>

            {filteredWorkers.length === 0 ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Ionicons name="people-outline" size={36} color="#bbb" />
                <Text style={styles.emptyTitle}>No matching workers</Text>
                <Text style={styles.emptySub}>
                  Try a different search term.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredWorkers}
                keyExtractor={(w) => w.id}
                contentContainerStyle={styles.workerList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const selected = item.id === ticket.assigned_to;
                  return (
                    <TouchableOpacity
                      style={[styles.workerRow, selected && styles.workerRowSelected]}
                      onPress={() => !selected && handleAssign(item)}
                      disabled={assigning || selected}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.avatar, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="person" size={18} color="#2E7D32" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.workerName}>{item.name}</Text>
                        <Text style={styles.workerEmail}>{item.email}</Text>
                      </View>
                      {selected ? (
                        <View style={styles.currentTag}>
                          <Ionicons name="checkmark" size={12} color="#2E7D32" />
                          <Text style={styles.currentTagText}>Current</Text>
                        </View>
                      ) : assigning ? (
                        <ActivityIndicator size="small" color="#2347B5" />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#bbb" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2347B5', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBack: { padding: 4 },
  headerAction: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  manageCta: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#d6dffb',
    backgroundColor: '#f5f8ff',
  },
  manageCtaText: {
    fontSize: 13, fontWeight: '700', color: '#2347B5',
    marginLeft: 6,
  },

  scroll: { paddingBottom: 40 },
  photo: { width: '100%', height: 220 },
  photoPlaceholder: {
    backgroundColor: '#e7eaf3', alignItems: 'center', justifyContent: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    marginTop: -20, padding: 20,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  category: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  badgeText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#888',
    marginTop: 18, marginBottom: 8, letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  description: { fontSize: 14, color: '#333', lineHeight: 20 },

  metaGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginTop: 14, gap: 8,
  },
  metaItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f6f8ff', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    width: '48%',
  },
  metaLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 },
  metaValue: { fontSize: 13, color: '#222', fontWeight: '600', marginTop: 1 },

  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  personName: { fontSize: 14, fontWeight: '700', color: '#222' },
  personSub: { fontSize: 12, color: '#777', marginTop: 1 },

  assignedBox: {
    backgroundColor: '#f5faf6', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#dcefe1',
  },
  assignedTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  assignedTagText: { fontSize: 11, color: '#2E7D32', fontWeight: '700', marginLeft: 4 },
  reassignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#d6dffb', backgroundColor: '#fff',
  },
  reassignBtnText: { color: '#2347B5', fontWeight: '700', marginLeft: 6, fontSize: 13 },

  unassignedBox: {
    backgroundColor: '#FFFBF2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#f5e4c3',
  },
  unassignedRow: { flexDirection: 'row', alignItems: 'center' },
  unassignedText: { fontSize: 13, color: '#7a5a14', fontWeight: '600', marginLeft: 8 },
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#2347B5',
  },
  assignBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },

  noteBox: {
    flexDirection: 'row', backgroundColor: '#f0f4ff', padding: 12,
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#2347B5',
  },
  noteText: { flex: 1, fontSize: 14, color: '#333', marginLeft: 8, lineHeight: 20 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#e53935',
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 14 },
  deleteHint: {
    fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center',
  },

  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#555', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: 16,
    maxHeight: '80%',
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginVertical: 10,
    backgroundColor: '#f3f5fb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#222',
    paddingVertical: 8, marginLeft: 8,
  },

  workerList: { paddingHorizontal: 20, paddingBottom: 12 },
  workerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10,
  },
  workerRowSelected: { backgroundColor: '#f5faf6' },
  workerName: { fontSize: 14, fontWeight: '700', color: '#222' },
  workerEmail: { fontSize: 12, color: '#777', marginTop: 1 },
  separator: { height: 1, backgroundColor: '#f0f0f5' },
  currentTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  currentTagText: { fontSize: 11, color: '#2E7D32', fontWeight: '700', marginLeft: 4 },
});
