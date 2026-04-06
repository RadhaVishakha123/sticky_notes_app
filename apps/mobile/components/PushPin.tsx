import Svg, { Circle, Ellipse, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

export function PushPin() {
  const size = 22;
  const r = 10;
  const cx = size / 2;       // 11
  const cy = r + 2;          // 12
  const shaftEnd = cy + r + 14; // 36

  return (
    <Svg width={size} height={shaftEnd + 2}>
      <Defs>
        <RadialGradient id="pinSphere" cx="35%" cy="28%" r="70%">
          <Stop offset="0%"   stopColor="#FECACA" />
          <Stop offset="30%"  stopColor="#EF4444" />
          <Stop offset="72%"  stopColor="#B91C1C" />
          <Stop offset="100%" stopColor="#7F1D1D" />
        </RadialGradient>
      </Defs>

      {/* Cast shadow on card surface */}
      <Ellipse
        cx={cx + 1} cy={cy + r + 4}
        rx={r * 0.75} ry={r * 0.28}
        fill="rgba(0,0,0,0.22)"
      />

      {/* Shaft */}
      <Line
        x1={cx} y1={cy + r - 2}
        x2={cx} y2={shaftEnd}
        stroke="#9CA3AF" strokeWidth={2.2} strokeLinecap="round"
      />

      {/* Pin head */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#pinSphere)" />

      {/* Primary highlight blob */}
      <Circle
        cx={cx - r * 0.28} cy={cy - r * 0.28}
        r={r * 0.32}
        fill="rgba(255,255,255,0.52)"
      />

      {/* Tiny specular hot-spot */}
      <Circle
        cx={cx - r * 0.34} cy={cy - r * 0.36}
        r={r * 0.13}
        fill="rgba(255,255,255,0.9)"
      />
    </Svg>
  );
}
