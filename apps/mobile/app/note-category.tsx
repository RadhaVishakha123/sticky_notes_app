import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { noteDraft, clearNoteDraft } from '../utils/noteDraft';
import { useThemeColors, useIsDark } from '../store/themeStore';

const CATEGORIES: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  darkBg: string;
  darkAccent: string;
  iconBg: string;
  accent: string;
  iconColor: string;
}[] = [
  {
    label: 'Education',
    icon: 'book-outline',
    bg: '#EFF6FF',
    darkBg: '#1E3A5F',
    darkAccent: '#EFF6FF',
    iconBg: '#BFDBFE',
    accent: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    label: 'Work',
    icon: 'briefcase-outline',
    bg: '#F0FDF4',
    darkBg: '#14532D',
    darkAccent: '#14532D',
    iconBg: '#BBF7D0',
    accent: '#7feec9',
    iconColor: '#10B981',
  },
  {
    label: 'Health',
    icon: 'fitness-outline',
    bg: '#FDF2F8',
    darkBg: '#4C1D3B',
    darkAccent: '#FDF2F8',
    iconBg: '#F9A8D4',
    accent: '#FDF2F8',
    iconColor: '#EC4899',
  },
  {
    label: 'Finance',
    icon: 'wallet-outline',
    bg: '#FFFBEB',
    darkBg: '#78350F',
    darkAccent: '#78350F',
    iconBg: '#FDE047',
    accent: '#f6b649',
    iconColor: '#D97706',
  },
  {
    label: 'Travel',
    icon: 'airplane-outline',
    bg: '#ECFDF5',
    darkBg: '#065F46',
    darkAccent: '#ECFDF5',
    iconBg: '#6EE7B7',
    accent: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    label: 'Ideas',
    icon: 'bulb-outline',
    bg: '#F5F3FF',
    darkBg: '#3B0764',
    darkAccent: '#3B0764',
    iconBg: '#D8B4FE',
    accent: '#a888f3',
    iconColor: '#7C3AED',
  },
  {
    label: 'Other',
    icon: 'document-outline',
    bg: '#F8FAFC',
    darkBg: '#1E293B',
    darkAccent: '#F8FAFC',
    iconBg: '#CBD5E1',
    accent: '#F8FAFC',
    iconColor: '#64748B',
  },
];

const N = CATEGORIES.length;
const OVERLAP = 32;

export default function NoteCategoryScreen() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const router = useRouter();
  // Pre-select whatever category the user last had in the editor (from draft)
  const [selected, setSelected] = useState<string | null>(
    noteDraft.category !== 'General' ? noteDraft.category : null,
  );

  // Re-sync selection every time this screen gains focus (editor may have changed the category)
  useFocusEffect(
    useCallback(() => {
      setSelected(noteDraft.category !== 'General' ? noteDraft.category : null);
    }, []),
  );
  // Stack height measured at runtime → accurate card height regardless of device
  const [stackH, setStackH] = useState(0);
  // N*cardH - (N-1)*OVERLAP = stackH  →  cardH = (stackH + (N-1)*OVERLAP) / N
  const cardH = stackH > 0 ? Math.max(80, Math.floor((stackH + (N - 1) * OVERLAP) / N)) : 0;

  const handleSelect = (label: string) => {
    setSelected(label);
    setTimeout(() => {
      router.push(`/note-editor?category=${encodeURIComponent(label)}`);
    }, 180);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            clearNoteDraft();
            router.back();
          }}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>New Note</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Intro */}
      <View style={s.intro}>
        <Text style={[s.introTitle, { color: c.text }]}>Capture your thoughts</Text>
        <Text style={[s.introSub, { color: c.textSub }]}>
          Choose a category to keep things structured
        </Text>
      </View>

      {/* Shingled stack — flex:1 fills the rest; onLayout gives exact height */}
      <View style={s.stack} onLayout={(e) => setStackH(e.nativeEvent.layout.height)}>
        {cardH > 0 &&
          CATEGORIES.map((cat, i) => {
            const isLast = i === N - 1;
            const isSelected = selected === cat.label;

            return (
              <TouchableOpacity
                key={cat.label}
                activeOpacity={0.88}
                onPress={() => handleSelect(cat.label)}
                style={[
                  s.card,
                  {
                    height: cardH,
                    zIndex: i + 1,
                    marginBottom: isLast ? 0 : -OVERLAP,
                    backgroundColor: isDark ? cat.darkBg : cat.bg,
                  },
                ]}
              >
                {/* Left accent bar — flush with card left edge */}
                <View
                  style={[s.leftBar, { backgroundColor: isDark ? cat.darkAccent : cat.accent }]}
                />

                {/* Icon + label */}
                <View style={s.cardLeft}>
                  <View style={[s.iconWrap, { backgroundColor: cat.iconBg }]}>
                    <Ionicons name={cat.icon} size={22} color={cat.iconColor} />
                  </View>
                  <Text style={[s.cardLabel, { color: c.text }, isSelected && s.cardLabelActive]}>
                    {cat.label}
                  </Text>
                </View>

                {/* Radio */}
                <View style={[s.radio, isSelected && s.radioActive]}>
                  {isSelected && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },

  intro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  introSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  // flex:1 fills remaining screen; onLayout reads exact px
  stack: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    // NO paddingLeft — leftBar is flush; right padding for radio
    paddingRight: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },

  leftBar: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 18,
    // borderTopLeftRadius handled by card's overflow:hidden
  },

  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
  cardLabelActive: { color: '#0369A1' },

  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  radioActive: { borderColor: '#0EA5E9', backgroundColor: '#E0F2FE' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0EA5E9' },
});
