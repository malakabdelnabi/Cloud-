import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { issueService } from '../../services/issueService';

const statusColors: Record<string, string> = {
  'Pending': '#FFA500',
  'In Progress': '#007AFF',
  'Resolved': '#34C759',
};

export default function MyIssuesScreen() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async () => {
    try {
      const data = await issueService.getMyIssues();
      setIssues(data.issues);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to fetch issues');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const renderIssue = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/issues/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#999' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardCategory}>📂 {item.category}</Text>
      <Text style={styles.cardLocation}>📍 {item.location}</Text>
      <Text style={styles.cardDate}>
        🕒 {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Issues</Text>
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => router.push('/issues/submit')}
      >
        <Text style={styles.submitBtnText}>+ Submit New Issue</Text>
      </TouchableOpacity>
      {issues.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No issues submitted yet</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={renderIssue}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  submitBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardCategory: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardLocation: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#999' },
});
