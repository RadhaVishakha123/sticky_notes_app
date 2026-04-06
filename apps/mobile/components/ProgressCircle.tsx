import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  completed: number;
  inProgress: number;
  todo: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircle({
  completed, inProgress, todo, total,
  size = 110, strokeWidth = 10,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C  = 2 * Math.PI * radius;

  const completedFrac  = total > 0 ? completed  / total : 0;
  const inProgressFrac = total > 0 ? inProgress / total : 0;
  const todoFrac       = total > 0 ? todo       / total : 0;

  // Start angle (degrees) for each segment, beginning at 12 o'clock
  const rot1 = -90;
  const rot2 = -90 + completedFrac * 360;
  const rot3 = -90 + (completedFrac + inProgressFrac) * 360;

  // Arc length (pixels) for each segment
  const len1 = completedFrac  * C;
  const len2 = inProgressFrac * C;
  const len3 = todoFrac       * C;

  const anim1 = useRef(new Animated.Value(len1)).current;
  const anim2 = useRef(new Animated.Value(len2)).current;
  const anim3 = useRef(new Animated.Value(len3)).current;

  useEffect(() => {
    // Reset each arc to its segment length (= nothing visible for that segment)
    // then animate to 0 (= fully drawn).
    //
    // KEY: strokeDasharray=[lenN, C-lenN] strictly bounds each segment to its
    // own arc — no bleed into neighbours regardless of animation state.
    // This fixes the "half circle when all same status" bug.
    anim1.setValue(len1);
    anim2.setValue(len2);
    anim3.setValue(len3);
    Animated.parallel([
      Animated.timing(anim1, { toValue: 0, duration: 800, useNativeDriver: false }),
      Animated.timing(anim2, { toValue: 0, duration: 800, useNativeDriver: false }),
      Animated.timing(anim3, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [completedFrac, inProgressFrac, todoFrac]);

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>

        {/* Background track */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none"
        />

        {total > 0 && (
          <>
            {/* Left To Do — gray */}
            {todoFrac > 0 && (
              <AnimatedCircle
                cx={cx} cy={cy} r={radius}
                stroke="#CBD5E1" strokeWidth={strokeWidth} fill="none"
                strokeDasharray={[len3, C - len3]}
                strokeDashoffset={anim3}
                strokeLinecap="butt"
                transform={`rotate(${rot3}, ${cx}, ${cy})`}
              />
            )}

            {/* In Progress — blue */}
            {inProgressFrac > 0 && (
              <AnimatedCircle
                cx={cx} cy={cy} r={radius}
                stroke="#3B82F6" strokeWidth={strokeWidth} fill="none"
                strokeDasharray={[len2, C - len2]}
                strokeDashoffset={anim2}
                strokeLinecap="butt"
                transform={`rotate(${rot2}, ${cx}, ${cy})`}
              />
            )}

            {/* Completed — green (top layer) */}
            {completedFrac > 0 && (
              <AnimatedCircle
                cx={cx} cy={cy} r={radius}
                stroke="#22C55E" strokeWidth={strokeWidth} fill="none"
                strokeDasharray={[len1, C - len1]}
                strokeDashoffset={anim1}
                strokeLinecap="butt"
                transform={`rotate(${rot1}, ${cx}, ${cy})`}
              />
            )}
          </>
        )}
      </Svg>

      {/* Centre label */}
      <View style={styles.center}>
        <Text style={styles.fraction}>{completed}/{total}</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center:   { alignItems: 'center' },
  fraction: { fontSize: 16, fontWeight: '800', color: '#1E293B', lineHeight: 20 },
  percent:  { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
});
