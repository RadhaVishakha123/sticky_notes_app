import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle, Ellipse, Line, Defs, RadialGradient, Stop, Polygon, Path,
} from 'react-native-svg';

// ── Push Pin (parameterized color) ────────────────────────────
const PIN_SCHEMES = [
  { hi: '#FECACA', mid: '#EF4444', lo: '#B91C1C', dk: '#7F1D1D' }, // red
  { hi: '#BFDBFE', mid: '#3B82F6', lo: '#1D4ED8', dk: '#1E3A8A' }, // blue
  { hi: '#99F6E4', mid: '#14B8A6', lo: '#0F766E', dk: '#134E4A' }, // teal
  { hi: '#FEF08A', mid: '#EAB308', lo: '#A16207', dk: '#713F12' }, // gold
];

function PinDecoration({ index }: { index: number }) {
  const p = PIN_SCHEMES[index % PIN_SCHEMES.length];
  const r = 10, cx = 11, cy = 12, shaftEnd = 36;
  const gid = `npg${index}`;
  return (
    <View style={st.pinWrap}>
      <Svg width={22} height={38}>
        <Defs>
          <RadialGradient id={gid} cx="35%" cy="28%" r="70%">
            <Stop offset="0%"   stopColor={p.hi} />
            <Stop offset="30%"  stopColor={p.mid} />
            <Stop offset="72%"  stopColor={p.lo} />
            <Stop offset="100%" stopColor={p.dk} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={12} cy={cy + r + 4} rx={r * 0.75} ry={r * 0.28} fill="rgba(0,0,0,0.22)" />
        <Line x1={cx} y1={cy + r - 2} x2={cx} y2={shaftEnd} stroke="#9CA3AF" strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} />
        <Circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.32} fill="rgba(255,255,255,0.52)" />
        <Circle cx={cx - r * 0.34} cy={cy - r * 0.36} r={r * 0.13} fill="rgba(255,255,255,0.9)" />
      </Svg>
    </View>
  );
}

// ── Washi Tape ────────────────────────────────────────────────
const TAPE_PALETTE = ['#FDE68A', '#BAE6FD', '#BBF7D0', '#FBD5E0', '#DDD6FE', '#FED7AA'];

function TapeDecoration({ index }: { index: number }) {
  const color = TAPE_PALETTE[index % TAPE_PALETTE.length];
  const rot = ((index % 3) - 1) * 2; // -2, 0, or +2 deg
  return (
    <View style={[st.tapeWrap, { transform: [{ rotate: `${rot}deg` }] }]}>
      <View style={[st.tape, { backgroundColor: color }]}>
        {[8, 20, 32, 44, 56, 68].map((x) => (
          <View key={x} style={[st.tapeDot, { left: x }]} />
        ))}
      </View>
    </View>
  );
}

// ── Star Sticker ──────────────────────────────────────────────
function starPts(cx: number, cy: number, R: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const STAR_PALETTE = [
  { fill: '#FBBF24', stroke: '#D97706' },
  { fill: '#34D399', stroke: '#059669' },
  { fill: '#F472B6', stroke: '#DB2777' },
];

function StarDecoration({ index }: { index: number }) {
  const c = STAR_PALETTE[index % STAR_PALETTE.length];
  const side = index % 4 < 2 ? { left: 8 } : { right: 8 };
  const rot = index % 2 === 0 ? '-10deg' : '10deg';
  return (
    <View style={[st.stickerWrap, side, { transform: [{ rotate: rot }] }]}>
      <Svg width={28} height={28}>
        <Polygon points={starPts(14, 14, 12, 5)} fill={c.fill} stroke={c.stroke} strokeWidth={1} />
        <Polygon points={starPts(14, 14, 7, 3)} fill="rgba(255,255,255,0.3)" />
      </Svg>
    </View>
  );
}

// ── Heart Sticker ─────────────────────────────────────────────
const HEART_PALETTE = [
  { fill: '#F87171', stroke: '#EF4444' },
  { fill: '#C084FC', stroke: '#A855F7' },
  { fill: '#FB923C', stroke: '#F97316' },
];

function HeartDecoration({ index }: { index: number }) {
  const c = HEART_PALETTE[index % HEART_PALETTE.length];
  const side = index % 4 < 2 ? { right: 8 } : { left: 8 };
  const rot = index % 2 === 0 ? '10deg' : '-10deg';
  return (
    <View style={[st.stickerWrap, side, { transform: [{ rotate: rot }] }]}>
      <Svg width={26} height={24}>
        <Path
          d="M13,21 C13,21 2,13 2,7 C2,3.5 5,1.5 8,1.5 C10,1.5 12,3 13,4.5 C14,3 16,1.5 18,1.5 C21,1.5 24,3.5 24,7 C24,13 13,21 13,21 Z"
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth={0.8}
        />
        <Path
          d="M8,5 C6.5,6.5 6,8 7,10"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────
// 11-item cycle (odd = breaks 2-column symmetry so both columns stay varied)
const CYCLE = ['pin', 'star', 'heart', 'pin', 'tape', 'star', 'pin', 'heart', 'tape', 'pin', 'star'] as const;

export function NoteDecoration({ index }: { index: number }) {
  const type = CYCLE[index % CYCLE.length];
  if (type === 'pin')   return <PinDecoration index={index} />;
  if (type === 'tape')  return <TapeDecoration index={index} />;
  if (type === 'star')  return <StarDecoration index={index} />;
  if (type === 'heart') return <HeartDecoration index={index} />;
  return null;
}

const st = StyleSheet.create({
  pinWrap: {
    position: 'absolute', top: -14, left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  tapeWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  tape: {
    width: 82, height: 16, borderRadius: 2,
    opacity: 0.9, overflow: 'hidden',
    justifyContent: 'center',
  },
  tapeDot: {
    position: 'absolute', width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)', top: 6,
  },
  stickerWrap: {
    position: 'absolute', top: -8, zIndex: 10,
  },
});
