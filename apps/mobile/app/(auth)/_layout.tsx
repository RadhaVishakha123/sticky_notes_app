import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useIsDark } from '../../store/themeStore';
import { AUTH_COLORS } from '../../constants/colors';

export default function AuthLayout() {
  const isDark = useIsDark();
  const rootBg = isDark ? '#020C1B' : AUTH_COLORS.sky;
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: rootBg }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: rootBg },
        }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
