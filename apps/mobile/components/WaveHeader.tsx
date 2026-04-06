import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '../store/themeStore';

interface WaveHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const LIGHT_GRAD = ['#0284C7', '#38BDF8'] as const;
const DARK_GRAD  = ['#020C1B', '#0C2D4A'] as const;

export function WaveHeader({ title, subtitle, icon }: WaveHeaderProps) {
  const { width } = useWindowDimensions();
  const h = 300;
  const c = useThemeColors();
  const isDark = useIsDark();

  const cardBg = c.surface;
  const w = width;

  const l1 = isDark ? '#0C2D4A' : '#0EA5E9';
  const l2 = isDark ? '#0E4D77' : '#38BDF8';
  const l3 = isDark ? '#0369A1' : '#7DD3FC';

  return (
    <View style={[styles.container, { height: h }]}>
      {/* Gradient background */}
      <LinearGradient
        colors={isDark ? DARK_GRAD : LIGHT_GRAD}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleMid} />

      {/* Content */}
      <View style={styles.textArea}>
        {/* Icon — outer glow ring + inner frosted circle */}
        <View style={styles.iconRing}>
          <View style={styles.iconInner}>
            <Ionicons name={icon} size={34} color="#fff" />
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* 4-layer SVG waves */}
      <View style={[styles.waves, { width }]}>
        <Svg width={w} height={80} viewBox={`0 0 ${w} 80`} style={StyleSheet.absoluteFill}>
          <Path d={`M0,10 C${w*0.2},50 ${w*0.5},0 ${w},25 L${w},80 L0,80 Z`}   fill={l1} />
          <Path d={`M0,28 C${w*0.25},62 ${w*0.6},8 ${w},38 L${w},80 L0,80 Z`}   fill={l2} />
          <Path d={`M0,42 C${w*0.3},72 ${w*0.65},20 ${w},50 L${w},80 L0,80 Z`}  fill={l3} />
          <Path d={`M0,58 C${w*0.35},80 ${w*0.7},38 ${w},62 L${w},80 L0,80 Z`}  fill={cardBg} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },

  // Decorative background circles
  circleTopRight: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -50,
  },
  circleBottomLeft: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 70, left: -30,
  },
  circleMid: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)', top: 40, left: '45%',
  },

  textArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 52,
  },

  // Outer glow ring
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  // Inner frosted circle
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  waves: {
    height: 80,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
