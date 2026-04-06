import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

// Root index — redirect based on auth state, but wait for loadToken() to complete first
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) return null; // stay invisible while loadToken() runs

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
