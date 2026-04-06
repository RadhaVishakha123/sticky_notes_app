import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useIsDark } from '@/store/themeStore';

const GRADIENT_COLORS = ['#DBEAFE', '#EFF6FF', '#FFFFFF'] as const;
const DARK_GRADIENT = ['#020617', '#0F172A', '#020617'] as const;
const GRADIENT_LOCATIONS = [0, 0.45, 1] as const;
interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GradientScreen({ children, style }: Props) {
  const colors = useThemeColors();
  const isDark = useIsDark();
  return (
    <LinearGradient
      colors={isDark ? DARK_GRADIENT : GRADIENT_COLORS}
       locations={GRADIENT_LOCATIONS}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: isDark ? colors.bg : 'transparent', }, style]}
        edges={['top']}
      >
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
