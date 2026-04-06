import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api';
import { AUTH_COLORS, COLORS } from '../../constants/colors';
import { WaveHeader } from '../../components/WaveHeader';
import { useThemeColors, useIsDark } from '../../store/themeStore';
import { resetPasswordSchema } from '../../utils/validation';

export default function ResetPasswordScreen() {
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const c = useThemeColors();
  const isDark = useIsDark();

  const validate = () => {
    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setNewPasswordError(errs.newPassword?.[0] ?? '');
      setConfirmPasswordError(errs.confirmPassword?.[0] ?? '');
      return false;
    }
    setNewPasswordError('');
    setConfirmPasswordError('');
    return true;
  };

  const handleReset = async () => {
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: email ?? '',
        token: token ?? '',
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to reset password. Please try again.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? '#020C1B' : AUTH_COLORS.sky }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <WaveHeader
        icon="key-outline"
        title="New Password"
        subtitle="Set a new secure password"
      />

      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <ScrollView
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.cardTitle, { color: c.text }]}>Set New Password</Text>

          {serverError ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#3B1515' : '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorBoxText}>{serverError}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.successBox, { backgroundColor: isDark ? '#14301A' : '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
              <Text style={styles.successText}>
                Password updated! Redirecting to sign in…
              </Text>
            </View>
          ) : null}

          {/* New Password */}
          <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.border }, newPasswordError ? [styles.inputRowError, { backgroundColor: isDark ? '#2D1515' : '#FFF8F8' }] : null]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={newPasswordError ? COLORS.error : AUTH_COLORS.inputIcon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, { flex: 1, color: c.text }]}
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setNewPasswordError(''); setConfirmPasswordError(''); }}
              placeholder="New password"
              placeholderTextColor={AUTH_COLORS.inputIcon}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showNew ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={AUTH_COLORS.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {newPasswordError ? <Text style={styles.fieldError}>{newPasswordError}</Text> : null}

          {/* Confirm Password */}
          <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.border }, confirmPasswordError ? [styles.inputRowError, { backgroundColor: isDark ? '#2D1515' : '#FFF8F8' }] : null]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={confirmPasswordError ? COLORS.error : AUTH_COLORS.inputIcon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, { flex: 1, color: c.text }]}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setConfirmPasswordError(''); }}
              placeholder="Confirm password"
              placeholderTextColor={AUTH_COLORS.inputIcon}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={AUTH_COLORS.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.fieldError}>{confirmPasswordError}</Text> : null}

          {/* Save button */}
          <TouchableOpacity
            style={[styles.button, (isLoading || success) && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={isLoading || success}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH_COLORS.sky },
  card: {
    flex: 1,
    backgroundColor: AUTH_COLORS.cardBg,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 24 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: { color: COLORS.error, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: '#16A34A', fontSize: 13, flex: 1 },
  inputRow: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: AUTH_COLORS.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  inputRowError: { borderColor: COLORS.error, backgroundColor: '#FFF8F8' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: '#1E293B', paddingVertical: 0 },
  eyeBtn: { padding: 4, marginLeft: 6 },
  fieldError: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
    marginLeft: 18,
  },
  button: {
    height: 56,
    backgroundColor: AUTH_COLORS.skyMid,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: AUTH_COLORS.skyMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
});
