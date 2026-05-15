import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      await login({ email, password });
      const storedUser = await SecureStore.getItemAsync('userData');
      const user = JSON.parse(storedUser!);
      if (user.role === 'Admin') router.replace('/admin' as any);
      else if (user.role === 'Facility Manager') router.replace('/manager' as any);
      else if (user.role === 'Worker') router.replace('/worker' as any);
      else router.replace('/community/submit' as any);
    } catch (err: any) {
      Alert.alert('Login Failed', err.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        <Image
          source={require('../../assets/images/logo-banner.png')}
          style={styles.logoBanner}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome to CampusCare</Text>
          <Text style={styles.welcomeSub}>Sign in to your account.</Text>

          <Text style={styles.label}>University Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="name@university.edu"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password' as any)}
            style={styles.forgotWrapper}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Login →</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/register' as any)}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Register</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  logoBanner: { width: 280, height: 100, marginBottom: 32, backgroundColor: 'transparent' },
  card: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4, marginBottom: 24
  },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: '#888', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, paddingHorizontal: 12,
    marginBottom: 16, backgroundColor: '#fafafa'
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#333' },
  forgotWrapper: { alignItems: 'flex-end', marginBottom: 20 },
  forgot: { color: '#2347B5', fontSize: 13, fontWeight: '600' },
  loginBtn: {
    backgroundColor: '#2347B5', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center'
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerText: { fontSize: 14, color: '#555' },
  registerLink: { color: '#2347B5', fontWeight: 'bold' },
});
