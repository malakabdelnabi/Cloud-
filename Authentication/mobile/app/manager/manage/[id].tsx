import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, SafeAreaView, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { managerService, TicketDetail } from '../../../services/managerService';

type Status = 'Pending' | 'In Progress' | 'Resolved';
type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

const STATUS_OPTIONS: { key: Status; label: string; desc: string; icon: any; color: string; bg: string }[] = [
  {
    key: 'Pending',
    label: 'Pending',
    desc: 'Awaiting review or assignment',
    icon: 'time-outline',
    color: '#B26A00',
    bg: '#FFF4E5',
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    desc: 'A worker is actively handling this',
    icon: 'sync-outline',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    desc: 'Work is complete — ready to close',
    icon: 'checkmark-circle-outline',
    color: '#2E7D32',
    bg: '#E8F5E9',
  },
];

const PRIORITY_OPTIONS: { key: Priority; color: string }[] = [
  { key: 'Low',    color: '#6c757d' },
  { key: 'Medium', color: '#2347B5' },
  { key: 'High',   color: '#e67e22' },
  { key: 'Urgent', color: '#e53935' },
];

export default function ManageIssueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>('Pending');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const res = await managerService.getTicketById(token, id);
      setTicket(res.ticket);
      setStatus(res.ticket.status);
      setPriority(res.ticket.priority);
      setNotes(res.ticket.internal_notes || '');
    } catch (err: any) {
      setLoadError(err?.error || 'Failed to load issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, token]);

  const dirty =
    !!ticket &&
    (status !== ticket.status ||
      priority !== ticket.priority ||
      (notes || '') !== (ticket.internal_notes || ''));

  const handleSave = async () => {
    if (!token || !ticket || !dirty) return;
    try {
      setSaving(true);
      const updates: Promise<unknown>[] = [];

      if (priority !== ticket.priority) {
        updates.push(managerService.updateTicketPriority(token, ticket.id, priority));
      }

      const statusChanged = status !== ticket.status;
      const notesChanged  = (notes || '') !== (ticket.internal_notes || '');

      if (statusChanged) {
        updates.push(
          managerService.updateTicketStatus(token, ticket.id, status, notesChanged ? notes : undefined),
        );
      } else if (notesChanged) {
        updates.push(managerService.addInternalNote(token, ticket.id, notes));
      }

      await Promise.all(updates);

      setTicket((prev) =>
        prev ? { ...prev, status, priority, internal_notes: notes } : prev,
      );
      Alert.alert('Saved', 'Issue updated successfully.');
    } catch (err: any) {
      Alert.alert('Save failed', err?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!token || !ticket) return;
    Alert.alert(
      'Close this issue?',
      'This marks the issue as Resolved and finalizes it. Internal notes will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close issue',
          style: 'destructive',
          onPress: async () => {
            try {
              setClosing(true);
              await managerService.closeTicket(
                token,
                ticket.id,
                notes && notes !== ticket.internal_notes ? notes : undefined,
              );
              setTicket((prev) =>
                prev ? { ...prev, status: 'Resolved', internal_notes: notes } : prev,
              );
              setStatus('Resolved');
              Alert.alert('Closed', 'The issue has been closed.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Close failed', err?.error || 'Could not close the issue.');
            } finally {
              setClosing(false);
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

  if (loadError || !ticket) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="warning-outline" size={36} color="#e53935" />
        <Text style={styles.errorText}>{loadError || 'Issue not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canClose = ticket.status === 'Resolved' || status === 'Resolved';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Issue</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="construct-outline" size={16} color="#2347B5" />
              <Text style={styles.summaryCategory}>{ticket.category}</Text>
            </View>
            <Text style={styles.summaryDesc} numberOfLines={2}>
              {ticket.description}
            </Text>
            <View style={styles.summaryMeta}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.summaryMetaText} numberOfLines={1}>
                {ticket.location}
              </Text>
              <View style={{ width: 12 }} />
              <Ionicons name="person-outline" size={12} color="#888" />
              <Text style={styles.summaryMetaText} numberOfLines={1}>
                {ticket.worker ? ticket.worker.name : 'Unassigned'}
              </Text>
            </View>
          </View>

          {/* Status */}
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusList}>
            {STATUS_OPTIONS.map((opt) => {
              const selected = status === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.statusCard, selected && styles.statusCardSelected]}
                  onPress={() => setStatus(opt.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.statusIconWrap, { backgroundColor: opt.bg }]}>
                    <Ionicons name={opt.icon} size={20} color={opt.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.statusLabel}>{opt.label}</Text>
                    <Text style={styles.statusDesc}>{opt.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      selected && { borderColor: opt.color, backgroundColor: opt.color },
                    ]}
                  >
                    {selected ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Priority */}
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => {
              const selected = priority === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.priorityChip,
                    selected && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => setPriority(opt.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="flag"
                    size={12}
                    color={selected ? '#fff' : opt.color}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: selected ? '#fff' : opt.color },
                    ]}
                  >
                    {opt.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Internal notes */}
          <Text style={styles.sectionTitle}>Internal notes</Text>
          <Text style={styles.sectionHint}>
            Visible to managers and workers — not to the reporter.
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add context, next steps, or closing remarks…"
            placeholderTextColor="#aaa"
            multiline
            textAlignVertical="top"
          />

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {dirty ? 'Save changes' : 'No changes to save'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Close issue */}
          {canClose ? (
            <View style={styles.closeBox}>
              <View style={styles.closeHeader}>
                <Ionicons name="lock-closed-outline" size={16} color="#2E7D32" />
                <Text style={styles.closeTitle}>Close this issue</Text>
              </View>
              <Text style={styles.closeDesc}>
                {ticket.status === 'Resolved'
                  ? 'This issue is already marked Resolved. Close it to finalize and archive any notes.'
                  : 'Status is set to Resolved. Save first, or close directly to finalize.'}
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, closing && { opacity: 0.7 }]}
                onPress={handleClose}
                disabled={closing}
                activeOpacity={0.85}
              >
                {closing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={styles.closeBtnText}>Close Issue</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  scroll: { padding: 16, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  summaryCategory: { fontSize: 15, fontWeight: 'bold', color: '#222', marginLeft: 6 },
  summaryDesc: { fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 18 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center' },
  summaryMetaText: { fontSize: 11, color: '#777', marginLeft: 4, maxWidth: 130 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#222',
    marginTop: 8, marginBottom: 8, letterSpacing: 0.3,
  },
  sectionHint: {
    fontSize: 11, color: '#888', marginTop: -4, marginBottom: 8,
  },

  statusList: { gap: 8, marginBottom: 16 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#eef0f7',
  },
  statusCardSelected: { borderColor: '#2347B5', backgroundColor: '#f5f8ff' },
  statusIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#222' },
  statusDesc: { fontSize: 12, color: '#777', marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#cfd6e7',
    alignItems: 'center', justifyContent: 'center',
  },

  priorityRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16,
  },
  priorityChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#e6e9f2',
    backgroundColor: '#fff',
  },
  priorityText: { fontSize: 12, fontWeight: '700' },

  notesInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 14, color: '#222', minHeight: 100,
    borderWidth: 1, borderColor: '#e6e9f2', marginBottom: 16,
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2347B5', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#2347B5', shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  saveBtnDisabled: { backgroundColor: '#a8b3d1', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 },

  closeBox: {
    marginTop: 20, padding: 16, borderRadius: 12,
    backgroundColor: '#f5faf6', borderWidth: 1, borderColor: '#dcefe1',
  },
  closeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  closeTitle: {
    fontSize: 14, fontWeight: '700', color: '#1f5a25', marginLeft: 6,
  },
  closeDesc: { fontSize: 13, color: '#3b6e44', lineHeight: 18, marginBottom: 12 },
  closeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 12,
  },
  closeBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },

  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
