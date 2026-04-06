import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Must be registered here (module root / headless JS entry point) — NOT inside a React component.
// This fires even when the app is in background or killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED || type === EventType.PRESS) {
    console.log("from the index.js backngroung event run")
    const data = detail.notification?.data;
    if (data?.alarmTitle) {
      await AsyncStorage.setItem(
        'pendingAlarm',
        JSON.stringify({ title: data.alarmTitle, type: data.alarmType ?? 'task' })
      );
    }
  }
});

// Expo Router entry — must come after notifee registration
import 'expo-router/entry';
