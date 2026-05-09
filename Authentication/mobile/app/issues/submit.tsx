import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { issueService } from '../../services/issueService';

export default function SubmitIssueScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Electrical', 'Plumbing', 'Structural', 'Cleaning', 'Other'];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !location) {
      window.alert('Please fill in all required fields');
      return;
    }
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }
      await issueService.submitIssue(formData);
      window.alert('Issue submitted successfully!');
      router.push('/issues');
    } catch (err: any) {
      window.alert(err.error || 'Failed to submit issue');
    } finally {
      setIsLoading(false);
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }
      await issueService.submitIssue(formData);
      Alert.alert('Success', 'Issue submitted successfully!', [
        { text: 'OK', onPress: () => router.push('/issues') }
      ]);
    } catch (err: any) {
      window.alert(JSON.stringify(err) || 'Failed to submit issue');
    
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Submit an Issue</Text>
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter issue title"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>Location *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={location}
        onChangeText={setLocation}
      />
      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, category === cat && styles.categorySelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the issue in detail"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.label}>Photo (Optional)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={styles.photoBtnText}>📷 Pick a Photo</Text>
      </TouchableOpacity>
      {photo && (
        <Image source={{ uri: photo.uri }} style={styles.preview} />
      )}
      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Submit Issue</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  categorySelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryText: { color: '#555', fontSize: 14 },
  categoryTextSelected: { color: '#fff' },
  photoBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10 },
  photoBtnText: { fontSize: 16, color: '#007AFF' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledBtn: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});