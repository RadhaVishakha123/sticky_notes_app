import { Platform, Alert, NativeModules } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  AndroidVisibility,
  EventType,
  TriggerType,
} from '@notifee/react-native';

// v2 — no sound on channel so Android does not play notification sound separately.
// All alarm sound comes from expo-audio in alarm-screen.tsx, which we fully control.
// Cannot modify existing channel after creation, so new ID forces Android to create fresh.
const ALARM_CHANNEL_ID = 'alarm_fullscreen_v2';

async function ensureAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    vibrationPattern: [300, 500],
    bypassDnd: true,
  });
}

/**
 * Schedule a local alarm that fires even when the app is killed or screen is off.
 * Uses Android AlarmManager.setExactAndAllowWhileIdle via notifee.
 * Android only — iOS relies on backend FCM.
 *
 * @param id       Unique string ID (use task/event DB id)
 * @param title    Task or event title shown on alarm
 * @param alarmAt  Exact Date when alarm should fire
 * @param type     'task' | 'event'
 */
/**
 * Check exact alarm permission (Android 12+) and battery optimization,
 * prompting the user to fix either if needed.
 * Call once when the user first enables an alarm.
 */
/**
 * Check battery optimization and prompt the user to disable it if active.
 * Exact alarm permission is handled separately by requestAlarmPermission() in notifications.ts.
 */
export async function checkAlarmSystemPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // 1. Standard Android battery optimization — one-tap system dialog (no settings page needed).
    //    requestIgnoreBatteryOptimizations() resolves false if already granted (skip the wait).
    const dialogShown: boolean = await NativeModules.OverlayPermission.requestIgnoreBatteryOptimizations();
    if (dialogShown) {
      // Give the user a moment to respond to the system dialog before the next check.
      await new Promise<void>((r) => setTimeout(r, 1500));
    }

    // 2. OEM battery manager (Samsung, Xiaomi, Huawei, etc.) — cannot be auto-granted.
    //    Only show if battery optimization is STILL active — if the user already whitelisted
    //    the app (via the dialog above or manually), isBatteryOptimizationEnabled() returns
    //    false and we skip this alert so it never shows again.
    const stillOptimized = await notifee.isBatteryOptimizationEnabled();
    if (stillOptimized) {
      const powerInfo = await notifee.getPowerManagerInfo();
      if (powerInfo.activity) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Allow App to Run in Background',
            'Your device may delay or block alarms.\n\nAfter tapping "Open Settings":\n1. Find "Sticky Notes" in the list\n2. Tap it\n3. Select "Unrestricted" or "Don\'t optimize"\n\nThis ensures your alarms fire on time.',
            [
              { text: 'Later', style: 'cancel', onPress: () => resolve() },
              { text: 'Open Settings', onPress: () => { notifee.openPowerManagerSettings(); resolve(); } },
            ],
          );
        });
      }
    }
  } catch {
    // Non-critical — ignore if APIs unavailable
  }
}

export async function scheduleLocalAlarm(
  id: string,
  title: string,
  alarmAt: Date,
  type: 'task' | 'event' = 'task'
): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await ensureAlarmChannel();
    await notifee.createTriggerNotification(
      {
        id,
        title: type === 'event' ? '📅 Event Alarm' : '⏰ Task Alarm',
        body: title,
        android: {
          channelId: ALARM_CHANNEL_ID,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          vibrationPattern: [300, 500],
          largeIcon: 'ic_launcher',
          // Opens alarm screen automatically without user tap — wakes device from sleep/lock
          fullScreenAction: {
            id: 'default',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.NO_USER_ACTION],
          },
          pressAction: { id: 'default', launchActivity: 'default' },
        },
        data: { alarmTitle: title, alarmType: type, alarmId: id },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: alarmAt.getTime(),
        alarmManager: {
          allowWhileIdle: true, // fires even in Doze mode
        },
      }
    );
    const alarms = await notifee.getTriggerNotifications();
    console.log('New alarms from the alarm manager:', alarms.length);
    console.log('[AlarmManager] scheduled local alarm:', id);
  } catch (err) {
    console.error('[AlarmManager] scheduleLocalAlarm failed:', err);
  }
}

/**
 * Cancel a previously scheduled local alarm.
 * Call when task/event alarm is toggled off, edited, or deleted.
 */
export async function cancelLocalAlarm(id: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  try {
    await notifee.cancelTriggerNotification(id);
    console.log('❌ Cancelling alarm from the alarm manager:', id);
    const alarms = await notifee.getTriggerNotifications();
    console.log('Remaining alarms from the alarm manager:', alarms.length);
  } catch {
    // Alarm may not exist — ignore
  }
}

/**
 * Register notifee foreground event handler.
 * Call once at app startup (_layout.tsx).
 * Returns unsubscribe function.
 */
export function registerNotifeeHandler(
  onAlarm: (title: string, type: string, alarmId: string) => void
): () => void {
  if (Platform.OS !== 'android') return () => {};
  console.log('FRONETND ALARM PAGE REGISTERED');
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const data = detail.notification?.data as
        | { alarmTitle?: string; alarmType?: string; alarmId?: string }
        | undefined;
      if (data?.alarmTitle) {
        onAlarm(data.alarmTitle, data.alarmType ?? 'task', data.alarmId ?? '');
      }
    }
  });
}

// Module-level callback — registered by _layout.tsx so the styled modal can be shown
// from anywhere without needing React hooks in this utility file.
// Accepts an onDismissed callback so checkAndPromptOverlayPermission can await user action.
let _showOverlayModal: ((onDismissed: () => void) => void) | null = null;

export function registerOverlayModalTrigger(fn: (onDismissed: () => void) => void) {
  _showOverlayModal = fn;
}

/**
 * Real check: uses the native OverlayPermissionModule (Settings.canDrawOverlays).
 * Falls back to false if the native module isn't available yet.
 */
async function canDrawOverlays(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await NativeModules.OverlayPermission.canDrawOverlays();
  } catch {
    return false;
  }
}

/**
 * Check if USE_FULL_SCREEN_INTENT is granted (required on Android 14+ for alarm
 * screen to open automatically without user tap).
 * Uses native OverlayPermissionModule which calls NotificationManager.canUseFullScreenIntent().
 * Opens the exact settings page for this app so the user just has to toggle it ON.
 * Returns true if settings were opened (caller should skip further prompts this session).
 */
export async function checkAndPromptFullScreenIntent(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted: boolean = await NativeModules.OverlayPermission.canUseFullScreenIntent();
    if (granted) return false;
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Enable Full Screen Alarms',
        'To allow alarms to wake your screen and open automatically when your phone is locked or the screen is off, please enable "Full screen intents" for Sticky Notes.',
        [
          { text: 'Later', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Open Settings',
            onPress: () => { NativeModules.OverlayPermission.openFullScreenIntentSettings(); resolve(); },
          },
        ],
      );
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if SYSTEM_ALERT_WINDOW (Display over other apps) is granted using
 * the native Settings.canDrawOverlays() API — accurate on all Android versions.
 * If not granted, shows the styled OverlayPermissionModal.
 */
export async function checkAndPromptOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const granted = await canDrawOverlays();
  if (granted) return;
  const showModal = _showOverlayModal;
  if (!showModal) return;
  await new Promise<void>((resolve) => { showModal(resolve); });
}

/**
 * Check ALL permissions needed for alarm screen to open automatically on time, in all situations:
 *   - Phone locked / screen off
 *   - User using another app
 *   - App killed
 *
 * USE_FULL_SCREEN_INTENT alone handles all three cases — SYSTEM_ALERT_WINDOW is not needed.
 * Battery optimization must also be OFF so Samsung/OEM does not delay alarm delivery.
 *
 * Call whenever user enables an alarm (task-editor / event-editor) AND on every app open.
 */
export async function checkAllAlarmPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Each step awaits user action (tap) before the next prompt appears.
  // 1. Full screen intent — auto-opens alarm screen when screen is OFF / locked
  await checkAndPromptFullScreenIntent();
  // 2. Battery optimization — prevents Samsung/OEM from killing the alarm process
  await checkAlarmSystemPermissions();
  // 3. Display over other apps — allows alarm screen to launch when screen is ON and another app is open
  await checkAndPromptOverlayPermission();  
}
