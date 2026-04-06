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
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AUTH_COLORS, COLORS } from '../../constants/colors';
import { WaveHeader } from '../../components/WaveHeader';
import { useThemeColors, useIsDark } from '../../store/themeStore';
import { loginSchema } from '../../utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const { login, isLoading } = useAuthStore();
  const c = useThemeColors();
  const isDark = useIsDark();

  const validate = () => {
    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setEmailError(errs.email?.[0] ?? '');
      setPasswordError(errs.password?.[0] ?? '');
      return false;
    }
    setEmailError('');
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setServerError('');
    if (!validate()) return;

    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed. Please check your connection and try again.';
      setServerError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? '#020C1B' : AUTH_COLORS.sky }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <WaveHeader icon="log-in-outline" title="Welcome back" subtitle="Sign in to continue" />
      {/* <Image source={require('../../assets/images/header.png')} style={styles.headerImg} resizeMode="cover" /> */}

      {/* White card */}
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <ScrollView
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.cardTitle, { color: c.text }]}>Sign In</Text>

          {serverError ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#3B1515' : '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorBoxText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Email input */}
          <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.border }, emailError ? [styles.inputRowError, { backgroundColor: isDark ? '#2D1515' : '#FFF8F8' }] : null]}>
            <Ionicons name="mail-outline" size={20} color={emailError ? COLORS.error : AUTH_COLORS.inputIcon} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: c.text }]}
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(''); }}
              placeholder="Email address"
              placeholderTextColor={AUTH_COLORS.inputIcon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

          {/* Password input */}
          <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.border }, passwordError ? [styles.inputRowError, { backgroundColor: isDark ? '#2D1515' : '#FFF8F8' }] : null]}>
            <Ionicons name="lock-closed-outline" size={20} color={passwordError ? COLORS.error : AUTH_COLORS.inputIcon} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { flex: 1, color: c.text }]}
              value={password}
              onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
              placeholder="Password"
              placeholderTextColor={AUTH_COLORS.inputIcon}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={AUTH_COLORS.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSub }]}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Create one</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_COLORS.sky,
  },
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },
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
  inputRowError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF8F8',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },
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
    marginBottom: 4,
    shadowColor: AUTH_COLORS.skyMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
  },
  forgotLink: {
    color: AUTH_COLORS.skyMid,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  link: {
    color: AUTH_COLORS.skyMid,
    fontSize: 14,
    fontWeight: '700',
  },
  headerImg: {
    width: '100%',
    height: 300,
  },
});
