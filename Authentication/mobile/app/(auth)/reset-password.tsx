import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Invalid link', 'This password reset link is missing a token.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err: any) {
      Alert.alert(
        'Reset Failed',
        err?.error || 'Could not reset password. The link may have expired.'
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
          onPress={() => router.replace('/')}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={10} color="#2347B5" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Choose a new password for your account.
        </Text>

        <View style={styles.card}>
          {done ? (
            <View style={styles.successBox}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <Ionicons name="checkmark" size={44} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Password updated!</Text>
              <Text style={styles.successSub}>
                Your password has been changed successfully. Use your new
                password the next time you sign in.
              </Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => router.replace('/')}
              >
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.successBtnText}>Continue to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.welcome}>Create new password</Text>
              <Text style={styles.welcomeSub}>
                Your new password must be at least 8 characters long.
              </Text>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#aaa"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#aaa"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#aaa"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your new password"
                  placeholderTextColor="#aaa"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
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
                  <Text style={styles.primaryBtnText}>Update Password →</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
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

  logoImage: { width: 100, height: 100, marginBottom: 16, backgroundColor: 'transparent' },
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
    flexDirection: 'row', justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  successBox: { alignItems: 'center', paddingVertical: 16 },
  successIconOuter: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: '#E6F4EA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  successIconInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E7D32', shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  successTitle: {
    fontSize: 22, fontWeight: 'bold',
    color: '#111', marginBottom: 8, textAlign: 'center',
  },
  successSub: {
    fontSize: 14, color: '#666', textAlign: 'center',
    marginBottom: 28, lineHeight: 20, paddingHorizontal: 4,
  },
  successBtn: {
    backgroundColor: '#2347B5', borderRadius: 24,
    paddingVertical: 12, paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'stretch',
  },
  successBtnText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
    letterSpacing: 0.3,
  },
});
