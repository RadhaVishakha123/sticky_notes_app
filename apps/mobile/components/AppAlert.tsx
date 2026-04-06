import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../store/themeStore';

// ─── Types ────────────────────────────────────────────────────

type AlertType = 'error' | 'warning' | 'confirm' | 'logout' | 'info' | 'permission' | 'success';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertConfig = {
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

// ─── Meta ─────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_META: Record<AlertType, { icon: IoniconName; color: string; bg: string }> = {
  error:      { icon: 'alert-circle',          color: '#EF4444', bg: '#FEF2F2' },
  warning:    { icon: 'alert-circle-outline',  color: '#F59E0B', bg: '#FFFBEB' },
  confirm:    { icon: 'trash-outline',         color: '#EF4444', bg: '#FEF2F2' },
  logout:     { icon: 'log-out-outline',       color: '#F59E0B', bg: '#FFFBEB' },
  info:       { icon: 'information-circle',    color: '#3B82F6', bg: '#EFF6FF' },
  permission: { icon: 'lock-closed-outline',   color: '#8B5CF6', bg: '#F5F3FF' },
  success:    { icon: 'checkmark-circle',      color: '#10B981', bg: '#ECFDF5' },
};

// ─── Hook ─────────────────────────────────────────────────────

export function useAppAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = (cfg: AlertConfig) => setConfig(cfg);
  const hide = () => setConfig(null);

  const AlertModal = config ? (
    <AppAlertModal config={config} onClose={hide} />
  ) : null;

  return { showAlert, AlertModal };
}

// ─── Modal ────────────────────────────────────────────────────

function AppAlertModal({ config, onClose }: { config: AlertConfig; onClose: () => void }) {
  const c = useThemeColors();
  const meta = TYPE_META[config.type];

  const buttons: AlertButton[] = config.buttons ?? [{ text: 'Got it', style: 'default' }];

  const handlePress = (btn: AlertButton) => {
    onClose();
    btn.onPress?.();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: c.surface }]}>
          {/* Icon badge */}
          <View style={[s.iconBadge, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={32} color={meta.color} />
          </View>

          {/* Text */}
          <Text style={[s.title, { color: c.text }]}>{config.title}</Text>
          {config.message ? (
            <Text style={[s.message, { color: c.textSub }]}>{config.message}</Text>
          ) : null}

          {/* Buttons */}
          <View style={[s.btnRow, buttons.length === 1 && s.btnRowSingle]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const btnColor = isDestructive ? '#EF4444' : isCancel ? c.border : meta.color;
              const textColor = isCancel ? c.textSub : '#fff';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.btn,
                    buttons.length === 1 && s.btnFull,
                    isCancel
                      ? [s.btnOutline, { borderColor: c.border }]
                      : { backgroundColor: btnColor },
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.btnText, { color: isCancel ? c.textSub : textColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  btnRowSingle: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    flex: 1,
  },
  btnOutline: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
