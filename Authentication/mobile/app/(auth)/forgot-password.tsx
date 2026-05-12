import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert(
        'Request Failed',
        err?.error || 'Could not send reset instructions. Try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color="#2347B5" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🔐</Text>
        </View>
        <Text style={styles.appName}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          No worries — we&apos;ll help you reset it.
        </Text>

        <View style={styles.card}>
          {sent ? (
            <View style={styles.successBox}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
              </View>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successSub}>
                If an account exists for{' '}
                <Text style={{ fontWeight: 'bold' }}>{email.trim()}</Text>, we&apos;ve
                sent password reset instructions.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.primaryBtnText}>Back to Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSent(false);
                  setEmail('');
                }}
                style={styles.resendWrap}
              >
                <Text style={styles.resendText}>
                  Didn&apos;t receive an email?{' '}
                  <Text style={styles.resendLink}>Try again</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.welcome}>Reset your password</Text>
              <Text style={styles.welcomeSub}>
                Enter the email associated with your account and we&apos;ll send you
                a link to reset your password.
              </Text>

              <Text style={styles.label}>University Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#aaa"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@university.edu"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Link →</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {!sent && (
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.bottomText}>
              Remember your password?{' '}
              <Text style={styles.bottomLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },

  backLink: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', marginBottom: 16,
  },
  backText: { color: '#2347B5', fontSize: 14, fontWeight: '600', marginLeft: 4 },

  logoBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#2347B5', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#2347B5', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32, textAlign: 'center' },

  card: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 12, elevation: 4, marginBottom: 24,
  },
  welcome: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, paddingHorizontal: 12,
    marginBottom: 20, backgroundColor: '#fafafa',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#333' },

  primaryBtn: {
    backgroundColor: '#2347B5', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  bottomText: { fontSize: 14, color: '#555' },
  bottomLink: { color: '#2347B5', fontWeight: 'bold' },

  successBox: { alignItems: 'center', paddingVertical: 8 },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  successSub: {
    fontSize: 13, color: '#666', textAlign: 'center',
    marginBottom: 24, lineHeight: 18,
  },
  resendWrap: { marginTop: 16 },
  resendText: { fontSize: 13, color: '#666' },
  resendLink: { color: '#2347B5', fontWeight: 'bold' },
});
