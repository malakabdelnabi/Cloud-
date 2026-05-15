import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  TouchableOpacity, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { workerService, WorkerTicket } from '../../../services/workerService';

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

export default function WorkerIssueWorkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<WorkerTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comment, setComment] = useState('');
  const [startingWork, setStartingWork] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [completingTicket, setCompletingTicket] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const load = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await workerService.getTicketById(token, id);
      setTicket(res.ticket);
    } catch (err: any) {
      setError(err?.error || 'Failed to load issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, token]);

  const handleStartWork = async () => {
    if (!token || !ticket) return;
    try {
      setStartingWork(true);
      const res = await workerService.markInProgress(token, ticket.id);
      setTicket((prev) => (prev ? { ...prev, ...res.ticket } : prev));
      Alert.alert('Started', 'This issue is now marked as In Progress.');
    } catch (err: any) {
      Alert.alert('Could not start', err?.error || 'Failed to mark in progress.');
    } finally {
      setStartingWork(false);
    }
  };

  const handleAddComment = async () => {
    if (!token || !ticket) return;
    const text = comment.trim();
    if (!text) {
      Alert.alert('Empty comment', 'Please write something before posting.');
      return;
    }
    try {
      setSubmittingComment(true);
      await workerService.addComment(token, ticket.id, text);
      setComment('');
      Alert.alert('Comment added', 'Your update has been recorded.');
    } catch (err: any) {
      Alert.alert('Could not post', err?.error || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCompletionPhoto(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCompletionPhoto(result.assets[0]);
    }
  };

  const handleUploadCompletion = async () => {
    if (!token || !ticket || !completionPhoto) return;
    try {
      setCompletingTicket(true);
      const filename = completionPhoto.fileName || `completion_${Date.now()}.jpg`;
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mime = completionPhoto.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const res = await workerService.uploadCompletionPhoto(token, ticket.id, {
        uri: completionPhoto.uri,
        name: filename,
        type: mime,
      });
      setTicket((prev) => (prev ? { ...prev, ...res.ticket } : prev));
      setCompletionPhoto(null);
      Alert.alert('Resolved', 'Completion photo uploaded. Issue marked Resolved.');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.error || 'Failed to upload completion photo.');
    } finally {
      setCompletingTicket(false);
    }
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
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const s = STATUS_STYLES[ticket.status] || STATUS_STYLES.Pending;
  const priorityColor = PRIORITY_COLORS[ticket.priority] || '#2347B5';
  const canStart = ticket.status === 'Pending';
  const canComplete = ticket.status !== 'Resolved';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work on Issue</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

              {ticket.updated_at && ticket.updated_at !== ticket.created_at ? (
                <View style={styles.metaItem}>
                  <Ionicons name="refresh-outline" size={16} color="#2347B5" />
                  <View style={{ marginLeft: 6, flex: 1 }}>
                    <Text style={styles.metaLabel}>Updated</Text>
                    <Text style={styles.metaValue}>
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Mark In Progress */}
            <Text style={styles.sectionLabel}>Status actions</Text>
            {canStart ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleStartWork}
                disabled={startingWork}
                activeOpacity={0.85}
              >
                {startingWork ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play-circle-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Mark as In Progress</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#2347B5" />
                <Text style={styles.infoText}>
                  {ticket.status === 'In Progress'
                    ? 'You have started this issue.'
                    : 'This issue is resolved.'}
                </Text>
              </View>
            )}

            {/* Comment */}
            <Text style={styles.sectionLabel}>Work comment</Text>
            <View style={styles.commentBox}>
              <TextInput
                style={styles.commentInput}
                placeholder="Describe the work you've done…"
                placeholderTextColor="#aaa"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.commentBtn, !comment.trim() && styles.btnDisabled]}
                onPress={handleAddComment}
                disabled={submittingComment || !comment.trim()}
                activeOpacity={0.85}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={styles.commentBtnText}>Post comment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Completion photo */}
            <Text style={styles.sectionLabel}>Completion photo</Text>
            {ticket.completion_image_url ? (
              <View style={styles.completionDoneBox}>
                <Image
                  source={{ uri: ticket.completion_image_url }}
                  style={styles.completionPreview}
                />
                <View style={styles.completionDoneTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={styles.completionDoneText}>Completion photo uploaded</Text>
                </View>
              </View>
            ) : canComplete ? (
              <View style={styles.uploadBox}>
                {completionPhoto ? (
                  <Image
                    source={{ uri: completionPhoto.uri }}
                    style={styles.completionPreview}
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#888" />
                    <Text style={styles.uploadHint}>
                      Add a photo of the completed work
                    </Text>
                  </View>
                )}

                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={pickFromCamera}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera-outline" size={16} color="#2347B5" />
                    <Text style={styles.pickerBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={pickFromLibrary}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="images-outline" size={16} color="#2347B5" />
                    <Text style={styles.pickerBtnText}>Library</Text>
                  </TouchableOpacity>
                  {completionPhoto ? (
                    <TouchableOpacity
                      style={[styles.pickerBtn, styles.clearBtn]}
                      onPress={() => setCompletionPhoto(null)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#e53935" />
                      <Text style={[styles.pickerBtnText, { color: '#e53935' }]}>
                        Clear
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.successBtn,
                    (!completionPhoto || completingTicket) && styles.btnDisabled,
                  ]}
                  onPress={handleUploadCompletion}
                  disabled={!completionPhoto || completingTicket}
                  activeOpacity={0.85}
                >
                  {completingTicket ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                      <Text style={styles.successBtnText}>
                        Upload & mark Resolved
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Ionicons name="checkmark-done-outline" size={16} color="#2E7D32" />
                <Text style={[styles.infoText, { color: '#2E7D32' }]}>
                  This issue has been resolved.
                </Text>
              </View>
            )}
          </View>
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

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, backgroundColor: '#2347B5', gap: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f4ff', borderRadius: 10,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#2347B5',
  },
  infoText: { fontSize: 13, color: '#2347B5', marginLeft: 8, flex: 1 },

  commentBox: {
    backgroundColor: '#f6f8ff', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#d6dffb',
  },
  commentInput: {
    minHeight: 80, fontSize: 14, color: '#222',
    backgroundColor: '#fff', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#e2e8f5',
  },
  commentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2347B5',
  },
  commentBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  uploadBox: {
    backgroundColor: '#f6f8ff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#d6dffb',
  },
  uploadPlaceholder: {
    height: 140, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#eef2fb', borderRadius: 10,
    borderWidth: 1, borderColor: '#dbe3f5', borderStyle: 'dashed',
  },
  uploadHint: { fontSize: 12, color: '#888', marginTop: 6 },

  completionPreview: { width: '100%', height: 200, borderRadius: 10 },

  pickerRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#d6dffb', backgroundColor: '#fff',
  },
  pickerBtnText: { color: '#2347B5', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  clearBtn: { borderColor: '#f5c1bd', backgroundColor: '#fff5f4' },

  successBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2E7D32',
  },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 },
  btnDisabled: { opacity: 0.5 },

  completionDoneBox: {
    backgroundColor: '#f5faf6', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#dcefe1',
  },
  completionDoneTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start', marginTop: 10,
  },
  completionDoneText: { fontSize: 12, color: '#2E7D32', fontWeight: '700', marginLeft: 6 },

  errorText: { color: '#e53935', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#2347B5',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
