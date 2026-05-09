import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function TestAuthScreen() {
  const { login, register, logout, user, token, isLoading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Test User');
  const [role, setRole] = useState('Community Member');
  const [status, setStatus] = useState('');

  if (isLoading) return <Text>Loading...</Text>;

  const handleRegister = async () => {
    try {
      setStatus('Registering...');
      await register({ name, email, password, role });
      setStatus('Registration successful!');
    } catch (err: any) {
      setStatus(`Error: ${err.error || err.message || JSON.stringify(err)}`);
    }
  };

  const handleLogin = async () => {
    try {
      setStatus('Logging in...');
      await login({ email, password });
      setStatus('Login successful!');
    } catch (err: any) {
      setStatus(`Error: ${err.error || err.message || JSON.stringify(err)}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Auth Logic Test</Text>
      
      {user ? (
        <View>
          <Text>Logged in as: {user.name} ({user.role})</Text>
          <Text>Token: {token?.substring(0, 20)}...</Text>
          <Button title="Logout" onPress={logout} color="red" />
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
          <TextInput placeholder="Role" value={role} onChangeText={setRole} style={styles.input} />
          
          <View style={styles.buttons}>
            <Button title="Test Register" onPress={handleRegister} />
            <Button title="Test Login" onPress={handleLogin} />
          </View>
        </View>
      )}
      
      <Text style={styles.status}>{status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  form: { width: '100%', gap: 10 },
  input: { borderWidth: 1, padding: 10, borderRadius: 5 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  status: { marginTop: 20, color: 'blue', textAlign: 'center' }
});
