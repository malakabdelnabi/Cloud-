import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { issueService } from '../../services/issueService';

const statusColors: Record<string, string> = {
  'Pending': '#FFA500',
  'In Progress': '#007AFF',
  'Resolved': '#34C759',
};

const priorityColors: Record<string, string> = {
  'Low': '#34C759',
  'Medium': '#FFA500',
  'High': '#FF3B30',
  'Critical': '#8B0000',
};

const categories = ['All', 'Electrical', 'Plumbing', 'Structural', 'Cleaning', 'Other'];

export default function MyIssuesScreen() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchIssues = async () => {
    try {
      const data = await issueService.getMyIssues();
      setIssues(data.issues);
      setFilteredIssues(data.issues);
    } catch (err: any) {
      window.alert(err.error || 'Failed to fetch issues');
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

  const applyFilters = (text: string, category: string, data: any[]) => {
    let filtered = data;
    if (category !== 'All') {
      filtered = filtered.filter(issue => issue.category === category);
    }
    if (text.trim()) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(text.toLowerCase()) ||
        issue.location.toLowerCase().includes(text.toLowerCase()) ||
        issue.description?.toLowerCase().includes(text.toLowerCase())
      );
    }
    setFilteredIssues(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(text, selectedCategory, issues);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    applyFilters(searchText, category, issues);
  };

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
      <View style={styles.cardRow}>
        <Text style={styles.cardCategory}>📂 {item.category}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] || '#999' }]}>
          <Text style={styles.priorityText}>⚡ {item.priority || 'Low'}</Text>
        </View>
      </View>
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

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search by title, location..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryBtn, selectedCategory === item && styles.categorySelected]}
            onPress={() => handleCategoryFilter(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => router.push('/issues/submit')}
      >
        <Text style={styles.submitBtnText}>+ Submit New Issue</Text>
      </TouchableOpacity>

      {filteredIssues.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {issues.length === 0 ? 'No issues submitted yet' : 'No issues match your search'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredIssues}
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
  searchBar: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  categoryList: { marginBottom: 12 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8 },
  categorySelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryText: { color: '#555', fontSize: 14 },
  categoryTextSelected: { color: '#fff' },
  submitBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardCategory: { fontSize: 14, color: '#555' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardLocation: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#999' },
});