import { useState } from 'react';
import { router } from 'expo-router';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Platform, Pressable, Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { useThemeColors } from '../store/themeStore';
import { useHomeStore } from '../store/homeStore';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_H = 64;
const CORNER_R = 28;
const SCOOP_R = 34;
const FAB_SIZE = 60;


type CreateType = 'note' | 'task' | 'event' | 'expense';

const TAB_ITEMS = [
  { name: 'home',      label: 'Home',      icon: 'home-outline',          iconActive: 'home' },
  { name: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',      iconActive: 'calendar' },
  { name: 'expenses',  label: 'Expenses',  icon: 'wallet-outline',        iconActive: 'wallet' },
  { name: 'settings',  label: 'Settings',  icon: 'person-circle-outline', iconActive: 'person-circle' },
];

function getTabBarPath(totalH: number): string {
  const cx = SCREEN_W / 2;
  return [
    `M 0,${totalH}`,
    `L 0,${CORNER_R}`,
    `Q 0,0 ${CORNER_R},0`,
    `L ${cx - SCOOP_R},0`,
    `A ${SCOOP_R} ${SCOOP_R} 0 0 1 ${cx + SCOOP_R},0`,
    `L ${SCREEN_W - CORNER_R},0`,
    `Q ${SCREEN_W},0 ${SCREEN_W},${CORNER_R}`,
    `L ${SCREEN_W},${totalH}`,
    `Z`,
  ].join(' ');
}

// ─── Quick Action Sheet ───────────────────────────────────────
function QuickActionSheet({ onSelect, onClose, suggestedType }: {
  onSelect: (type: CreateType) => void;
  onClose: () => void;
  suggestedType: CreateType | null;
}) {
  const c = useThemeColors();
  const actions: { type: CreateType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
    { type: 'note',    icon: 'document-text-outline',   label: 'New Note',    color: '#FFEB3B' },
    { type: 'task',    icon: 'checkmark-circle-outline', label: 'New Task',    color: '#4CAF50' },
    { type: 'event',   icon: 'calendar-outline',         label: 'New Event',   color: '#2196F3' },
    { type: 'expense', icon: 'wallet-outline',           label: 'New Expense', color: '#10B981' },
  ];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <Text style={[styles.sheetTitle, { color: c.text }]}>Quick Create</Text>
          {actions.map((a) => {
            const isActive = suggestedType === a.type;
            const iconColor = a.color === '#FFEB3B' ? '#B8860B' : a.color;
            return (
              <TouchableOpacity
                key={a.type}
                style={[
                  styles.actionRow,
                  { borderBottomColor: c.hairline },
                  isActive && { backgroundColor: a.color + '18', borderLeftWidth: 3, borderLeftColor: a.color, paddingLeft: 11 },
                ]}
                onPress={() => onSelect(a.type)}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + (isActive ? '44' : '33') }]}>
                  <Ionicons name={a.icon} size={22} color={iconColor} />
                </View>
                <Text style={[styles.actionLabel, { color: c.text }]}>{a.label}</Text>
                {isActive && (
                  <View style={[styles.suggestChip, { backgroundColor: a.color + '33' }]}>
                    <Text style={[styles.suggestChipText, { color: iconColor }]}>Suggested</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Custom Tab Bar ──────────────────────────────────────
export default function TabBar({ state, descriptors: _descriptors, navigation }: BottomTabBarProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);
  const [containerH, setContainerH] = useState(BAR_H + insets.bottom);

  const homeSegment = useHomeStore((s) => s.homeSegment);
  const activeTabName = state.routes[state.index]?.name;
  const suggestedType: CreateType | null =
    activeTabName === 'calendar' ? 'event' :
    activeTabName === 'expenses' ? 'expense' :
    activeTabName === 'home'
      ? (homeSegment === 'notes' ? 'note' : homeSegment === 'tasks' ? 'task' : homeSegment === 'events' ? 'event' : null)
      : null;

  const handleSelect = (type: CreateType) => {
    setFabOpen(false);
    if (type === 'note') {
      setTimeout(() => router.push('/note-category'), 300);
    } else if (type === 'task') {
      setTimeout(() => router.push('/task-editor'), 300);
    } else if (type === 'event') {
      setTimeout(() => router.push('/event-editor'), 300);
    } else if (type === 'expense') {
      setTimeout(() => router.push('/expense-editor'), 300);
    }
  };

  const leftTabs = TAB_ITEMS.slice(0, 2);
  const rightTabs = TAB_ITEMS.slice(2, 4);

  const renderTab = (item: typeof TAB_ITEMS[0]) => {
    const route = state.routes.find((r) => r.name === item.name);
    if (!route) return null;
    const index = state.routes.indexOf(route);
    const isFocused = state.index === index;
    const color = isFocused ? COLORS.primary : c.textMuted;

    return (
      <TouchableOpacity
        key={item.name}
        style={styles.tabItem}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(item.name);
        }}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Ionicons
          name={(isFocused ? item.iconActive : item.icon) as keyof typeof Ionicons.glyphMap}
          size={24}
          color={color}
        />
        <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
        <View style={isFocused ? styles.activeDot : styles.inactiveDot} />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}
    >
      {/* SVG scooped background */}
      <Svg width={SCREEN_W} height={containerH} style={StyleSheet.absoluteFill}>
        <Path d={getTabBarPath(containerH)} fill={c.surface} />
      </Svg>

      {/* Tab row */}
      <View style={styles.row}>
        <View style={styles.tabSide}>{leftTabs.map(renderTab)}</View>
        <View style={styles.fabSlot} />
        <View style={styles.tabSide}>{rightTabs.map(renderTab)}</View>
      </View>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { borderColor: c.bg }]} onPress={() => setFabOpen(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {fabOpen && <QuickActionSheet suggestedType={suggestedType} onSelect={handleSelect} onClose={() => setFabOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_H,
    paddingHorizontal: 8,
  },
  tabSide: {
    flex: 1,
    flexDirection: 'row',
  },
  fabSlot: { width: SCOOP_R * 2 + 4 },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },
  inactiveDot: { width: 4, height: 4, marginTop: 3 },
  fab: {
    position: 'absolute',
    top: -(FAB_SIZE / 2) - 4,
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 100,
  },
  // Quick action sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  cancelRow: { paddingTop: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#94A3B8' },
  suggestChip: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6,
  },
  suggestChipText: { fontSize: 11, fontWeight: '700' },
  // Inputs
  input: {
    height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC', paddingHorizontal: 16, fontSize: 15, color: '#1E293B', marginBottom: 12,
  },
  inputMulti: { height: 80, paddingTop: 14 },
  inputTitle: {
    fontSize: 16, fontWeight: '600', color: '#1E293B',
    borderBottomWidth: 1.5, borderBottomColor: 'rgba(0,0,0,0.15)',
    paddingBottom: 8, marginBottom: 12,
  },
  inputContent: { fontSize: 14, color: '#374151', minHeight: 80, paddingTop: 4, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  datePillText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dot: { width: 28, height: 28, borderRadius: 14 },
  dotSelected: { borderWidth: 3, borderColor: '#1E293B' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  saveBtn: { flex: 1, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
