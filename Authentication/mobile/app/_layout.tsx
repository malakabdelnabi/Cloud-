import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Screens will be added by the UI teammate */}
      </Stack>
    </AuthProvider>
  );
}
