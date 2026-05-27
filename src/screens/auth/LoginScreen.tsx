import React, { useState, useRef } from 'react';
import { Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Dimensions,
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';

const { height } = Dimensions.get('window');
const GRADIENT_RATIO = 0.42;
const GRADIENT_HEIGHT = height * GRADIENT_RATIO;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollRef = useRef<any>(null);

  const handleLogin = async () => {
    setErro('');
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    try {
      await signIn(email.trim(), senha);
    } catch (error: any) {
      setErro(error?.response?.data?.message ?? error?.message ?? 'E-mail ou senha incorretos.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
      keyboardVerticalOffset={keyboardOpen ? Math.round(GRADIENT_HEIGHT / 2) : insets.top + 10}
    >
      <StatusBar barStyle="light-content" backgroundColor={palette.navy900} />

      {/* Fundo gradiente */}
      <LinearGradient colors={gradients.navyDark} style={styles.gradient}>
        {/* Círculos decorativos */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Logo e marca */}
        <View style={[styles.brandArea, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.logoBox}>
            <MaterialIcons name="car-repair" size={36} color={palette.white} />
          </View>
          <Text style={styles.brand}>DriveOn</Text>
          <Text style={styles.tagline}>Gestão de Oficinas Mecânicas</Text>
        </View>
      </LinearGradient>

      {/* Card de login */}
      <KeyboardAwareScrollView
        ref={r => (scrollRef.current = r)}
        style={[styles.card]}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: insets.bottom }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardHandle} />
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

        <TextInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email-outline" color={palette.navy800} />}
          style={styles.input}
          outlineColor={palette.slate200}
          activeOutlineColor={palette.navy800}
          outlineStyle={{ borderRadius: borderRadius.md }}
          theme={{ colors: { background: palette.slate50 } }}
        />

        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          mode="outlined"
          secureTextEntry={!senhaVisivel}
          left={<TextInput.Icon icon="lock-outline" color={palette.navy800} />}
          right={
            <TextInput.Icon
              icon={senhaVisivel ? 'eye-off' : 'eye'}
              onPress={() => setSenhaVisivel(!senhaVisivel)}
              color={palette.slate400}
            />
          }
          style={styles.input}
          outlineColor={palette.slate200}
          activeOutlineColor={palette.navy800}
          outlineStyle={{ borderRadius: borderRadius.md }}
          theme={{ colors: { background: palette.slate50 } }}
        />

        {erro ? <HelperText type="error" visible style={styles.errorText}>{erro}</HelperText> : null}

        {/* Botão de login com gradiente */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={gradients.navyPrimary}
            style={styles.loginBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color={palette.white} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Entrar</Text>
                <MaterialIcons name="arrow-forward" size={20} color={palette.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

          {/* API base hint removed to avoid showing the configured URL on startup */}
        </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.navy900,
  },
  gradient: {
    height: GRADIENT_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: 60,
    left: -40,
  },
  brandArea: {
    alignItems: 'center',
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    minHeight: height * 0.6,
    ...shadows.lg,
    zIndex: 20,
    elevation: 20,
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate200,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate500,
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: palette.slate50,
  },
  errorText: {
    marginTop: -8,
    marginBottom: spacing.sm,
  },
  loginBtn: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
    letterSpacing: 0.5,
  },
  hintBox: {
    marginTop: spacing.lg,
    backgroundColor: palette.navy50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.navy100,
  },
  hintText: {
    fontSize: 13,
    color: palette.navy800,
    flex: 1,
  },
  hintBold: { fontWeight: '700' },
});
