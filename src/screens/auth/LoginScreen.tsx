import React, { useState, useRef } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar, Dimensions,
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
    <LinearGradient colors={gradients.navyDark} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={palette.navy900} />

      {/* Círculos decorativos em degradê suave */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAwareScrollView
        ref={r => { scrollRef.current = r; }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo e marca */}
        <View style={styles.brandArea}>
          <View style={styles.logoBox}>
            <MaterialIcons name="car-repair" size={40} color={palette.navy500} />
          </View>
          <Text style={styles.brand}>DriveOn</Text>
          <Text style={styles.tagline}>Gestão de Oficinas Mecânicas</Text>
        </View>

        {/* Card de login glassmórfico premium */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" color="rgba(255, 255, 255, 0.5)" />}
            style={styles.input}
            textColor={palette.white}
            outlineColor="rgba(255, 255, 255, 0.08)"
            activeOutlineColor={palette.navy600}
            outlineStyle={{ borderRadius: borderRadius.md }}
            theme={{
              colors: {
                onSurfaceVariant: 'rgba(255, 255, 255, 0.4)',
                primary: palette.navy600,
              }
            }}
          />

          <TextInput
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            mode="outlined"
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-outline" color="rgba(255, 255, 255, 0.5)" />}
            right={
              <TextInput.Icon
                icon={senhaVisivel ? 'eye-off' : 'eye'}
                onPress={() => setSenhaVisivel(!senhaVisivel)}
                color="rgba(255, 255, 255, 0.5)"
              />
            }
            style={styles.input}
            textColor={palette.white}
            outlineColor="rgba(255, 255, 255, 0.08)"
            activeOutlineColor={palette.navy600}
            outlineStyle={{ borderRadius: borderRadius.md }}
            theme={{
              colors: {
                onSurfaceVariant: 'rgba(255, 255, 255, 0.4)',
                primary: palette.navy600,
              }
            }}
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
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.navy900,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.08)', // Azul translúcido
    top: -100,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.05)', // Roxo translúcido
    top: 140,
    left: -80,
  },
  brandArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 38,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 13,
    color: palette.slate400,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Fundo escuro super moderno
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...shadows.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate400,
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    fontSize: 15,
  },
  errorText: {
    marginTop: -8,
    marginBottom: spacing.sm,
    color: palette.rose600,
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
});

