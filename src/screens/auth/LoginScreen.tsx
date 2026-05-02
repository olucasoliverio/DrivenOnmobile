import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, Image, StatusBar,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@driveon.com');
  const [senha, setSenha] = useState('123456');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async () => {
    setErro('');
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    try {
      await signIn(email.trim(), senha);
    } catch {
      setErro('E-mail ou senha incorretos.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🔧</Text>
        </View>
        <Text style={styles.brand}>DriveOn</Text>
        <Text style={styles.tagline}>Gestão de Oficinas Mecânicas</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

        <TextInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
        />

        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          mode="outlined"
          secureTextEntry={!senhaVisivel}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={senhaVisivel ? 'eye-off' : 'eye'}
              onPress={() => setSenhaVisivel(!senhaVisivel)}
            />
          }
          style={styles.input}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
        />

        {erro ? <HelperText type="error" visible>{erro}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor={colors.primary}
        >
          Entrar
        </Button>

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 Acesso demo: qualquer e-mail + senha <Text style={styles.hintBold}>123456</Text></Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: { fontSize: 40 },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  hintBox: {
    marginTop: spacing.lg,
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  hintText: { fontSize: 13, color: '#1565C0', textAlign: 'center' },
  hintBold: { fontWeight: '700' },
});
