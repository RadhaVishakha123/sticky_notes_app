import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useIsDark, useThemeHydrated } from '../store/themeStore';
import { requestNotificationPermission, requestAlarmPermission } from '../utils/notifications';
import notifee from '@notifee/react-native';
import { scheduleLocalAlarm, cancelLocalAlarm, registerNotifeeHandler, registerOverlayModalTrigger, checkAllAlarmPermissions } from '../utils/alarmManager';
import { OverlayPermissionModal } from '../components/OverlayPermissionModal';
import { pushApi } from '../services/api';

SplashScreen.preventAutoHideAsync();

// Suppress FCM type='alarm' banners in foreground — notifee local alarm already shows the UI.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as { type?: string } | undefined;
    if (data?.type === 'alarm') {
      console.log('Suppressing FCM alarm banner in foreground');
      return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
    }
    return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
  },
});

export default function RootLayout() {
  const { loadToken, isAuthenticated, isInitialized } = useAuthStore();
  const isDark = useIsDark();
  const themeHydrated = useThemeHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  // Set to true the moment we decide to navigate to alarm-screen, so the auth
  // redirect (which fires in the same tick via setTimeout(0)) doesn't overwrite it.
  const alarmNavigatingRef = useRef(false);
  // Alarm triggered while app was killed/background — held until navigation is ready
  const [pendingAlarm, setPendingAlarm] = useState<{ title: string; type: string } | null>(null);
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  // Register the modal trigger so alarmManager.ts can open it without React hooks
  useEffect(() => {
    registerOverlayModalTrigger(() => setShowOverlayModal(true));
  }, []);

  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  // Run loadToken once on mount — restores session from SecureStore
  useEffect(() => {
    loadToken();
  }, []);

  // Detect alarm on cold start via two paths:
  //   1. Linking.getInitialURL() — app opened by AlarmMessagingService.kt fullScreenIntent deep link
  //   2. notifee.getInitialNotification() — app opened by notifee fullScreenAction (user pressed)
  // Both store to pendingAlarm so the navigation effect below can open alarm-screen once ready.
  useEffect(() => {
    // Path 1: deep link (stickynotes://alarm-screen?title=...&type=...)
    console.log('Initial URL:', Linking.getInitialURL());
    Linking.getInitialURL().then((url) => {
      if (url?.includes('alarm-screen')) {
        try {
          const parsed = new URL(url);
          const title = parsed.searchParams.get('title') ?? '';
          const type = parsed.searchParams.get('type') ?? 'task';
          if (title) setPendingAlarm({ title, type });
        } catch {// ignore
          }
      }
    });

    // Path 2: notifee notification press (user tapped fullscreen notification)
    notifee.getInitialNotification().then((initial) => {
      const data = initial?.notification?.data as { alarmTitle?: string; alarmType?: string } | undefined;
      if (data?.alarmTitle) {
        setPendingAlarm({ title: data.alarmTitle, type: data.alarmType ?? 'task' });
      }
    });

    // Path 3: notifee background event stored alarm while app was killed
    // (onBackgroundEvent in index.js writes to AsyncStorage when local alarm fires)
    AsyncStorage.getItem('pendingAlarm').then(async (stored) => {
      if (stored) {
        await AsyncStorage.removeItem('pendingAlarm');
        const alarm = JSON.parse(stored) as { title: string; type: string };
        setPendingAlarm(alarm);
      }
    });

    // Path 3 retry — onBackgroundEvent (headless JS) may still be writing when the
    // activity starts. Re-read after 1s to catch the alarm if the first read was too early.
    setTimeout(() => {
      AsyncStorage.getItem('pendingAlarm').then(async (stored) => {
        if (stored) {
          await AsyncStorage.removeItem('pendingAlarm');
          const alarm = JSON.parse(stored) as { title: string; type: string };
          setPendingAlarm(alarm);
        }
      });
    }, 1000);
  }, []);

  // Navigate to alarm screen once app is ready (handles killed-app launch from both paths above)
  useEffect(() => {
    if (!pendingAlarm || !isInitialized || !fontsLoaded || !themeHydrated) return;
    // Guard: multiple paths (AsyncStorage immediate, 1s retry, getInitialNotification) can all
    // set pendingAlarm. Without this check, alarm-screen would be pushed multiple times — each
    // instance plays its own sound, and dismissing only the top one leaves the others playing.
    if (alarmNavigatingRef.current) { setPendingAlarm(null); return; }
    alarmNavigatingRef.current = true;
    router.push({ pathname: '/alarm-screen', params: pendingAlarm });
    setPendingAlarm(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAlarm, isInitialized, fontsLoaded, themeHydrated]);

  // Ask notification + alarm permissions once authenticated,
  // then register the FCM device token with the backend.
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    requestNotificationPermission().then(async (granted) => {
      if (granted) {
        requestAlarmPermission();
        // Android 14+ requires USE_FULL_SCREEN_INTENT to be explicitly granted.
        // Open the app's notification settings once so the user can enable
        // "Full screen intents" — required for alarm auto-open without tap.
        if (Platform.OS === 'android') {
          checkAllAlarmPermissions();
        }
        try {
          const result = await Notifications.getDevicePushTokenAsync();
          const token = typeof result.data === 'string' ? result.data : null;
          if (token) {
            const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
            await AsyncStorage.setItem('fcm-device-token', token);
            await pushApi.registerToken(token, platform);
          }
        } catch (err) {
          console.error('[FCM] token registration failed:', err);
        }
      }
    });
  }, [isInitialized, isAuthenticated]);

  // Keep ref in sync so the setTimeout callback below reads the latest pathname.
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // Redirect based on auth state once token loading is complete.
  // Skip if already on alarm-screen — deep link from AlarmMessagingService already routed there.
  useEffect(() => {
    if (!isInitialized || !fontsLoaded || !themeHydrated) return;
    // Defer by one tick so the Root Layout navigator has mounted before we navigate.
    const t = setTimeout(() => {
      // Skip if alarm screen navigation was already triggered (ref set synchronously before push).
      if (alarmNavigatingRef.current || pathnameRef.current.startsWith('/alarm-screen')) return;
      try {
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/login');
        }
      } catch { /* navigator not ready yet — next render will retry */ }
    }, 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized, fontsLoaded, themeHydrated]);

  // Notification event handlers
  useEffect(() => {
    const openAlarm = (title: string, type: string) => {
      router.push({ pathname: '/alarm-screen', params: { title, type } });
    };

    // Deep link listener — catches stickynotes://alarm-screen?... when app is BACKGROUNDED.
    // Linking.getInitialURL() only works on cold start; this handles the background case
    // where AlarmMessagingService (FCM) sends the deep link while the app is already running.
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('alarm-screen')) {
        try {
          const parsed = new URL(url);
          const title = parsed.searchParams.get('title') ?? '';
          const type = parsed.searchParams.get('type') ?? 'task';
          if (title) {
            router.push({ pathname: '/alarm-screen', params: { title, type } });
          }
        } catch { /* ignore malformed URLs */ }
      }
    });

    // When app returns to foreground, check if background event stored an alarm.
    // onBackgroundEvent (index.js) writes to AsyncStorage when the alarm fires.
    // Race: onBackgroundEvent may still be writing when AppState fires — retry after 1s.
    const appStateSub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      let stored = await AsyncStorage.getItem('pendingAlarm');
      if (!stored) {
        // Wait 1s and retry — onBackgroundEvent may not have finished writing yet
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        stored = await AsyncStorage.getItem('pendingAlarm');
      }
      if (stored) {
        await AsyncStorage.removeItem('pendingAlarm');
        const alarm = JSON.parse(stored) as { title: string; type: string };
        openAlarm(alarm.title, alarm.type);
      }
    });

    // Foreground FCM handler:
    //   type='schedule_alarm' → schedule local alarm
    //   type='cancel_alarm'   → cancel local alarm
    //   type='alarm' (iOS only) → open alarm screen
    //   Android type='alarm' is handled by notifee's EventType.DELIVERED below
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as {
        type?: string;
        alarmTitle?: string;
        alarmType?: string;
        alarmId?: string;
        alarmAt?: string;
        todoId?: string;
        eventId?: string;
      } | undefined;

      if (!data) return;

      if (data.type === 'schedule_alarm' && data.alarmId && data.alarmTitle && data.alarmAt) {
        // Only schedule if alarm is still in the future — delayed FCM arrival after alarm
        // time would cause notifee to fire immediately, creating a second notification.
        const alarmTime = new Date(data.alarmAt).getTime();
        if (alarmTime > Date.now() + 5000) {
          scheduleLocalAlarm(
            data.alarmId,
            data.alarmTitle,
            new Date(data.alarmAt),
            (data.alarmType ?? 'task') as 'task' | 'event'
          ).catch(() => {});
        }
      } else if (data.type === 'cancel_alarm' && data.alarmId) {
        cancelLocalAlarm(data.alarmId).catch(() => {});
      } else if (data.type === 'task_reminder' && data.todoId) {
        // Reminder tapped while app is open — do nothing (banner is informational)
      } else if (data.type === 'event_reminder' && data.eventId) {
        // Reminder tapped while app is open — do nothing (banner is informational)
      } else if (data.alarmTitle && Platform.OS !== 'android') {
        // Android: notifee EventType.DELIVERED (registerNotifeeHandler) handles this.
        // Doing it here too would push alarm-screen twice.
        openAlarm(data.alarmTitle, data.alarmType ?? 'task');
      }
    });

    // Background/killed: user taps the notification banner
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        alarmTitle?: string;
        alarmType?: string;
        todoId?: string;
        eventId?: string;
      } | undefined;
      if (!data) return;
      if (data.type === 'task_reminder' && data.todoId) {
        router.push(`/task-editor?id=${data.todoId}`);
      } else if (data.type === 'event_reminder' && data.eventId) {
        router.push(`/event-editor?id=${data.eventId}`);
      } else if (data.alarmTitle) {
        openAlarm(data.alarmTitle, data.alarmType ?? 'task');
      }
    });

    // Notifee foreground handler — fires when local alarm triggers while app is open
    
    const notifeeUnsub = registerNotifeeHandler(openAlarm);

    return () => {
      linkingSub.remove();
      appStateSub.remove();
      foregroundSub.remove();
      responseSub.remove();
      notifeeUnsub();
    };
  }, []);

  // Keep splash screen visible until auth + fonts are ready
  useEffect(() => {
    if (fontsLoaded && isInitialized && themeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized, themeHydrated]);

  if (!fontsLoaded || !themeHydrated) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OverlayPermissionModal visible={showOverlayModal} onDismiss={() => setShowOverlayModal(false)} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="note-category" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="note-editor" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="task-editor" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="event-editor" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="expense-editor" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="alarm-screen" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="notification-settings" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
