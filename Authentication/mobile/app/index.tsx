import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register, user, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading]);

  const handleSubmit = async () => {
    if (!email || !password || (!isLoginMode && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      if (isLoginMode) {
        await login({ email, password });
      } else {
        await register({ name, email, password, role: 'Community Member' });
      }
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏘️ Community App</Text>
      <Text style={styles.subtitle}>
        {isLoginMode ? 'Welcome back!' : 'Create your account'}
      </Text>
      {!isLoginMode && (
        <>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </>
      )}
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>
              {isLoginMode ? 'Login' : 'Register'}
            </Text>
        }
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.switchBtn}
        onPress={() => setIsLoginMode(!isLoginMode)}
      >
        <Text style={styles.switchText}>
          {isLoginMode
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#888', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledBtn: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#007AFF', fontSize: 14 },
});
