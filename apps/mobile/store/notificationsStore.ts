import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseSettingsApi } from '../services/api';

interface NotificationsState {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  alarmsEnabled: boolean;
  setAlarmsEnabled: (v: boolean) => void;
  // Task reminder
  taskReminderEnabled: boolean;
  setTaskReminderEnabled: (v: boolean) => void;
  taskReminderHours: number;
  setTaskReminderHours: (v: number) => void;
  taskReminderMinutes: number;
  setTaskReminderMinutes: (v: number) => void;
  // Event reminder
  eventReminderEnabled: boolean;
  setEventReminderEnabled: (v: boolean) => void;
  eventReminderHours: number;
  setEventReminderHours: (v: number) => void;
  eventReminderMinutes: number;
  setEventReminderMinutes: (v: number) => void;
  // Expense notifications (synced to backend)
  expenseSummaryEnabled: boolean;
  expenseSummaryHour: number;    // local time
  expenseSummaryMinute: number;  // local time
  budget80AlertEnabled: boolean;
  budget100AlertEnabled: boolean;
  loadExpenseSettings: () => Promise<void>;
  saveExpenseSettings: (patch: {
    expenseSummaryEnabled?: boolean;
    expenseSummaryHour?: number;
    expenseSummaryMinute?: number;
    budget80AlertEnabled?: boolean;
    budget100AlertEnabled?: boolean;
  }) => Promise<void>;
}

/** Convert local HH:MM to UTC HH:MM string */
function localToUtcTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** Convert UTC HH:MM string to local { hour, minute } */
function utcToLocalTime(utcTime: string): { hour: number; minute: number } {
  const [utcH, utcM] = utcTime.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(utcH, utcM, 0, 0);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notificationsEnabled: true,
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      alarmsEnabled: true,
      setAlarmsEnabled: (v) => set({ alarmsEnabled: v }),
      taskReminderEnabled: true,
      setTaskReminderEnabled: (v) => set({ taskReminderEnabled: v }),
      taskReminderHours: 0,
      setTaskReminderHours: (v) => set({ taskReminderHours: v }),
      taskReminderMinutes: 30,
      setTaskReminderMinutes: (v) => set({ taskReminderMinutes: v }),
      eventReminderEnabled: true,
      setEventReminderEnabled: (v) => set({ eventReminderEnabled: v }),
      eventReminderHours: 0,
      setEventReminderHours: (v) => set({ eventReminderHours: v }),
      eventReminderMinutes: 30,
      setEventReminderMinutes: (v) => set({ eventReminderMinutes: v }),

      // Expense notifications
      expenseSummaryEnabled: false,
      expenseSummaryHour: 20,
      expenseSummaryMinute: 0,
      budget80AlertEnabled: true,
      budget100AlertEnabled: true,

      loadExpenseSettings: async () => {
        try {
          const s = await expenseSettingsApi.get();
          const local = utcToLocalTime(s.summaryTime);
          set({
            expenseSummaryEnabled: s.summaryEnabled,
            expenseSummaryHour: local.hour,
            expenseSummaryMinute: local.minute,
            budget80AlertEnabled: s.budget80AlertEnabled,
            budget100AlertEnabled: s.budget100AlertEnabled,
          });
        } catch {
          // keep cached values
        }
      },

      saveExpenseSettings: async (patch) => {
        const prev = get();
        const next = {
          expenseSummaryEnabled: patch.expenseSummaryEnabled ?? prev.expenseSummaryEnabled,
          expenseSummaryHour:    patch.expenseSummaryHour    ?? prev.expenseSummaryHour,
          expenseSummaryMinute:  patch.expenseSummaryMinute  ?? prev.expenseSummaryMinute,
          budget80AlertEnabled:  patch.budget80AlertEnabled  ?? prev.budget80AlertEnabled,
          budget100AlertEnabled: patch.budget100AlertEnabled ?? prev.budget100AlertEnabled,
        };
        set(next); // optimistic
        try {
          await expenseSettingsApi.update({
            summaryEnabled:        next.expenseSummaryEnabled,
            summaryTime:           localToUtcTime(next.expenseSummaryHour, next.expenseSummaryMinute),
            budget80AlertEnabled:  next.budget80AlertEnabled,
            budget100AlertEnabled: next.budget100AlertEnabled,
          });
        } catch {
          // revert
          set({
            expenseSummaryEnabled: prev.expenseSummaryEnabled,
            expenseSummaryHour:    prev.expenseSummaryHour,
            expenseSummaryMinute:  prev.expenseSummaryMinute,
            budget80AlertEnabled:  prev.budget80AlertEnabled,
            budget100AlertEnabled: prev.budget100AlertEnabled,
          });
        }
      },
    }),
    {
      name: 'notifications-preference',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
