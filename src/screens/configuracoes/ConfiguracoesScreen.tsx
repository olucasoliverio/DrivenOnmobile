import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Surface, TextInput, Button, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockConfiguracoes } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function ConfiguracoesScreen() {
  const { user, signOut } = useAuth();
  const [config, setConfig] = useState(mockConfiguracoes);

  return (
    <ScrollView style={styles.container}>
      {/* Dados da Oficina */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="store" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Dados da Oficina</Text>
        </View>
        <Divider style={{ marginBottom: spacing.md }} />
        <TextInput label="Nome da Oficina" value={config.nomeOficina} onChangeText={v => setConfig({ ...config, nomeOficina: v })} mode="outlined" style={styles.input} outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="CNPJ" value={config.cnpj} onChangeText={v => setConfig({ ...config, cnpj: v })} mode="outlined" style={styles.input} outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="Telefone" value={config.telefone} onChangeText={v => setConfig({ ...config, telefone: v })} mode="outlined" style={styles.input} keyboardType="phone-pad" outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="E-mail" value={config.email} onChangeText={v => setConfig({ ...config, email: v })} mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" outlineColor={colors.outline} activeOutlineColor={colors.primary} />
      </Surface>

      {/* Endereço */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="location-on" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Endereço</Text>
        </View>
        <Divider style={{ marginBottom: spacing.md }} />
        <TextInput label="Endereço" value={config.endereco} onChangeText={v => setConfig({ ...config, endereco: v })} mode="outlined" style={styles.input} outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="Cidade" value={config.cidade} onChangeText={v => setConfig({ ...config, cidade: v })} mode="outlined" style={styles.input} outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="Estado" value={config.estado} onChangeText={v => setConfig({ ...config, estado: v })} mode="outlined" style={styles.input} outlineColor={colors.outline} activeOutlineColor={colors.primary} />
        <TextInput label="CEP" value={config.cep} onChangeText={v => setConfig({ ...config, cep: v })} mode="outlined" style={styles.input} keyboardType="number-pad" outlineColor={colors.outline} activeOutlineColor={colors.primary} />
      </Surface>

      {/* Conta */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="account-circle" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Minha Conta</Text>
        </View>
        <Divider style={{ marginBottom: spacing.md }} />
        <View style={styles.userInfo}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user?.nome?.substring(0, 2).toUpperCase()}</Text></View>
          <View>
            <Text style={styles.userName}>{user?.nome}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPerfil}>{user?.perfil?.toUpperCase()}</Text>
          </View>
        </View>
      </Surface>

      <Button mode="contained" buttonColor={colors.primary} style={styles.saveBtn} onPress={() => {}}>
        Salvar Alterações
      </Button>

      <Button mode="outlined" textColor="#D32F2F" style={styles.logoutBtn} onPress={signOut}>
        Sair da Conta
      </Button>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  input: { marginBottom: spacing.sm, backgroundColor: '#FFF', fontSize: 14 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.onBackground },
  userEmail: { fontSize: 13, color: '#757575', marginTop: 2 },
  userPerfil: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 4 },
  saveBtn: { margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md },
  logoutBtn: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, borderColor: '#D32F2F' },
});
