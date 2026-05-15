import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  ActivityIndicator, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { ticketService } from '../../../services/ticketService';

type Ticket = {
  id: string;
  category: string;
  description: string;
  location: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at?: string;
  internal_notes?: string;
  image_url?: string | null;
  completion_image_url?: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  Pending: { bg: '#FFF4E5', color: '#B26A00', icon: 'time-outline' },
  'In Progress': { bg: '#E3F2FD', color: '#1565C0', icon: 'sync-outline' },
  Resolved: { bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle-outline' },
};

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await ticketService.getTicketById(token!, id!);
        setTicket(data.ticket);
      } catch (err: any) {
        setError(err?.error || 'Failed to load issue.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const s = STATUS_STYLES[ticket.status] || STATUS_STYLES.Pending;
  const updatedDifferent =
    ticket.updated_at && ticket.updated_at !== ticket.created_at;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <View style={{ width: 30 }} />
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

          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color="#2347B5" />
            <Text style={styles.metaText}>{ticket.location}</Text>
          </View>

          {ticket.priority ? (
            <>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.metaRow}>
                <Ionicons name="flag-outline" size={16} color="#2347B5" />
                <Text style={styles.metaText}>{ticket.priority}</Text>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Submitted</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#2347B5" />
            <Text style={styles.metaText}>
              {new Date(ticket.created_at).toLocaleString()}
            </Text>
          </View>

          {updatedDifferent ? (
            <>
              <Text style={styles.sectionLabel}>Last Update</Text>
              <View style={styles.metaRow}>
                <Ionicons name="refresh-outline" size={16} color="#2347B5" />
                <Text style={styles.metaText}>
                  {new Date(ticket.updated_at!).toLocaleString()}
                </Text>
              </View>
            </>
          ) : null}

          {ticket.internal_notes ? (
            <>
              <Text style={styles.sectionLabel}>Worker Update</Text>
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

          {ticket.completion_image_url ? (
            <>
              <Text style={styles.sectionLabel}>Completion Photo</Text>
              <Image
                source={{ uri: ticket.completion_image_url }}
                style={styles.completionPhoto}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
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
  scroll: { paddingBottom: 40 },

  photo: { width: '100%', height: 240 },
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
    marginTop: 18, marginBottom: 6, letterSpacing: 0.5,
  },
  description: { fontSize: 14, color: '#333', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 14, color: '#333', marginLeft: 6 },
  noteBox: {
    flexDirection: 'row', backgroundColor: '#f0f4ff', padding: 12,
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#2347B5',
  },
  noteText: { flex: 1, fontSize: 14, color: '#333', marginLeft: 8, lineHeight: 20 },
  completionPhoto: { width: '100%', height: 200, borderRadius: 12 },

  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  backBtn: {
    marginTop: 16, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  backText: { color: '#fff', fontWeight: '600' },
});
