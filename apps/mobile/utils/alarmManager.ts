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
    const batterySettings = await notifee.getPowerManagerInfo();
    if (batterySettings.activity) {
      Alert.alert(
        'Disable Battery Optimization',
        'For alarms to ring on time, disable battery optimization for Sticky Notes.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open Settings', onPress: () => notifee.openPowerManagerSettings() },
        ],
      );
    }
  } catch {
    // Non-critical — ignore if notifee APIs unavailable
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
        data: { alarmTitle: title, alarmType: type },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: alarmAt.getTime(),
        alarmManager: {
          allowWhileIdle: true, // fires even in Doze mode
        },
      }
    );
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
  onAlarm: (title: string, type: string) => void
): () => void {
  if (Platform.OS !== 'android') return () => {};
  console.log('FRONETND ALARM PAGE REGISTERED');
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const data = detail.notification?.data as
        | { alarmTitle?: string; alarmType?: string }
        | undefined;
      if (data?.alarmTitle) {
        onAlarm(data.alarmTitle, data.alarmType ?? 'task');
      }
    }
  });
}

// Module-level callback — registered by _layout.tsx so the styled modal can be shown
// from anywhere without needing React hooks in this utility file.
let _showOverlayModal: (() => void) | null = null;

export function registerOverlayModalTrigger(fn: () => void) {
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
    Alert.alert(
      'Enable Full Screen Alarms',
      'To allow alarms to open automatically on your screen (even when using other apps), please enable "Full screen intents" for Sticky Notes.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => NativeModules.OverlayPermission.openFullScreenIntentSettings(),
        },
      ],
    );
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
  _showOverlayModal?.();
}

/**
 * Check ALL permissions needed for alarm screen to open over other apps automatically.
 * Call this whenever user enables an alarm (task-editor / event-editor) AND on app open.
 *
 * Required permissions:
 *   1. USE_FULL_SCREEN_INTENT (Android 14+) — allows alarm screen to appear over other apps
 *   2. SYSTEM_ALERT_WINDOW — display over other apps
 *   3. Battery optimization OFF — prevents OS from delaying alarm delivery
 *
 * Alerts are shown one at a time with a short delay between them so they don't overlap.
 */
export async function checkAllAlarmPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // 1. Full screen intent — most critical, needed to auto-open over other apps
  const fsiNotGranted = await checkAndPromptFullScreenIntent();
  // Small delay so alerts don't stack on top of each other
  if (fsiNotGranted) await new Promise<void>((r) => setTimeout(r, 600));
  // 2. Display over other apps
  await checkAndPromptOverlayPermission();
  // 3. Battery optimization
  await new Promise<void>((r) => setTimeout(r, 600));
  checkAlarmSystemPermissions();
}
