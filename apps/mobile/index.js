import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

// Must be registered here (module root / headless JS entry point) — NOT inside a React component.
// This fires even when the app is in background or killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED || type === EventType.PRESS) {
    const data = detail.notification?.data;
    if (data?.alarmTitle) {
      // notification id === alarmId (set in scheduleLocalAlarm); also in data.alarmId as of current build
      const alarmId = data.alarmId ?? detail.notification?.id ?? '';

      // Write AsyncStorage and launch the screen IN PARALLEL — do not await storage
      // before firing launchAlarmScreen, as that delay makes the alarm screen open late.
      const storageWrite = AsyncStorage.setItem(
        'pendingAlarm',
        JSON.stringify({ title: data.alarmTitle, type: data.alarmType ?? 'task', alarmId })
      );

      // DELIVERED only: directly launch the app so the alarm screen appears without tap.
      // startActivity() is allowed from background when SYSTEM_ALERT_WINDOW is granted —
      // this handles screen-ON + using another app. fullScreenAction handles screen-off/locked.
      if (type === EventType.DELIVERED) {
        NativeModules.OverlayPermission?.launchAlarmScreen?.(
          data.alarmTitle,
          data.alarmType ?? 'task',
          alarmId
        )?.catch?.((e) => console.warn('[AlarmBg] launchAlarmScreen failed:', e));
      }

      await storageWrite;
    }
  }
});

// Expo Router entry — must come after notifee registration
import 'expo-router/entry';
