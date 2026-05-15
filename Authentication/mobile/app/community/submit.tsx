import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';

const CATEGORIES = [
  { key: 'Electrical', icon: 'flash-outline' as const },
  { key: 'Plumbing', icon: 'water-outline' as const },
  { key: 'Cleaning', icon: 'sparkles-outline' as const },
  { key: 'Furniture', icon: 'bed-outline' as const },
];

export default function SubmitIssueScreen() {
  const { token } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const choosePhoto = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setImageUri(null);
    setDescription('');
    setCategory(null);
    setBuilding('');
    setFloor('');
    setRoom('');
  };

  const handleSubmit = async () => {
    if (!imageUri) return Alert.alert('Missing photo', 'Please attach a photo of the issue.');
    if (!description.trim()) return Alert.alert('Missing description', 'Please describe the issue.');
    if (!category) return Alert.alert('Missing category', 'Please select a category.');
    if (!building.trim() || !floor.trim() || !room.trim()) {
      return Alert.alert('Missing location', 'Please specify building, floor, and room.');
    }

    const location = `Building ${building.trim()}, Floor ${floor.trim()}, Room ${room.trim()}`;

    try {
      setSubmitting(true);
      await ticketService.createTicket(token!, {
        description: description.trim(),
        category,
        location,
        imageUri,
      });
      Alert.alert('Issue Submitted', 'Your issue has been submitted successfully.', [
        { text: 'OK', onPress: resetForm },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.error || 'Could not submit issue. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submit an Issue</Text>
        <Text style={styles.headerSub}>Report a facility problem</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <Text style={styles.label}>Photo</Text>
          <TouchableOpacity style={styles.photoBox} onPress={choosePhoto} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#2347B5" />
                <Text style={styles.photoText}>Tap to capture or upload</Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={choosePhoto} style={styles.changePhotoBtn}>
              <Ionicons name="refresh-outline" size={14} color="#2347B5" />
              <Text style={styles.changePhotoText}>Change photo</Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue in detail..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(({ key, icon }) => {
              const selected = category === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  onPress={() => setCategory(key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={selected ? '#fff' : '#2347B5'}
                  />
                  <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location */}
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.inputInline}
              placeholder="Building (e.g. A)"
              placeholderTextColor="#aaa"
              value={building}
              onChangeText={setBuilding}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="layers-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInline}
                placeholder="Floor"
                placeholderTextColor="#aaa"
                value={floor}
                onChangeText={setFloor}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Ionicons name="key-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInline}
                placeholder="Room"
                placeholderTextColor="#aaa"
                value={room}
                onChangeText={setRoom}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit Issue</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    backgroundColor: '#2347B5', paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#cfd9f7', marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },

  photoBox: {
    width: '100%', height: 180, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#cfd9f7', borderStyle: 'dashed',
    backgroundColor: '#fff', overflow: 'hidden',
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoText: { marginTop: 8, color: '#666', fontSize: 13 },
  photo: { width: '100%', height: '100%' },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
    marginTop: 6, paddingVertical: 4,
  },
  changePhotoText: { color: '#2347B5', fontSize: 12, fontWeight: '600', marginLeft: 4 },

  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#333',
  },
  textArea: { minHeight: 100 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    paddingHorizontal: 12, marginBottom: 10,
  },
  inputInline: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#333' },
  row: { flexDirection: 'row' },

  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  categoryChip: {
    width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfd9f7',
    borderRadius: 10, paddingVertical: 14, marginBottom: 10,
  },
  categoryChipActive: { backgroundColor: '#2347B5', borderColor: '#2347B5' },
  categoryText: { color: '#2347B5', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  categoryTextActive: { color: '#fff' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2347B5', borderRadius: 12, paddingVertical: 16, marginTop: 20,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
