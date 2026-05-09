import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Login' }} />
        <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="issues/index" options={{ title: 'My Issues', headerShown: true }} />
        <Stack.Screen name="issues/submit" options={{ title: 'Submit Issue', headerShown: true }} />
      </Stack>
    </AuthProvider>
  );
}
