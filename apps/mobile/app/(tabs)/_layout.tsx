import { Tabs } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import { useIsDark } from '../../store/themeStore';

export default function TabsLayout() {
  const isDark = useIsDark();
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="expenses" />
      <Tabs.Screen name="settings" />
    </Tabs>
    </ThemeProvider>
  );
}
