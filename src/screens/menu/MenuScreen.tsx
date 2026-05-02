import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: string;
  color: string;
  desc: string;
}

const menuItems: MenuItem[] = [
  { icon: 'people', label: 'Clientes', screen: 'Clientes', color: '#1565C0', desc: 'Gerencie sua carteira' },
  { icon: 'directions-car', label: 'Veículos', screen: 'Veiculos', color: '#0097A7', desc: 'Frota cadastrada' },
  { icon: 'request-quote', label: 'Orçamentos', screen: 'Orcamentos', color: '#F57F17', desc: 'Propostas e aprovações' },
  { icon: 'payments', label: 'Pagamentos', screen: 'Pagamentos', color: '#2E7D32', desc: 'Contas e extrato' },
  { icon: 'inventory', label: 'Estoque', screen: 'Estoque', color: '#6A1B9A', desc: 'Peças e produtos' },
  { icon: 'local-shipping', label: 'Fornecedores', screen: 'Fornecedores', color: '#E65100', desc: 'Parceiros e contatos' },
  { icon: 'handyman', label: 'Serviços', screen: 'Servicos', color: '#37474F', desc: 'Tabela de serviços' },
  { icon: 'bar-chart', label: 'Relatórios', screen: 'Relatorios', color: '#1B5E20', desc: 'Análises e exportações' },
  { icon: 'settings', label: 'Configurações', screen: 'Configuracoes', color: '#424242', desc: 'Dados da oficina' },
  { icon: 'manage-accounts', label: 'Usuários', screen: 'Usuarios', color: '#880E4F', desc: 'Equipe e permissões' },
];

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Perfil do usuário */}
      <Surface style={styles.profileCard} elevation={1}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{user?.nome?.substring(0, 2).toUpperCase() ?? 'AD'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.nome ?? 'Administrador'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <View style={styles.perfilBadge}>
            <Text style={styles.perfilText}>{user?.perfil?.toUpperCase() ?? 'ADMIN'}</Text>
          </View>
        </View>
      </Surface>

      {/* Grid de menus */}
      <Text style={styles.sectionTitle}>Módulos</Text>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.gridItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <Surface style={styles.gridCard} elevation={1}>
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <MaterialIcons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
              <Text style={styles.gridDesc}>{item.desc}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sair */}
      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <MaterialIcons name="logout" size={20} color="#D32F2F" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { margin: spacing.lg, borderRadius: borderRadius.lg, padding: spacing.md, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.onBackground },
  userEmail: { fontSize: 12, color: '#757575', marginTop: 2 },
  perfilBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
  perfilText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  gridItem: { width: '47%' },
  gridCard: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF', alignItems: 'flex-start' },
  iconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  gridLabel: { fontSize: 14, fontWeight: '700', color: colors.onBackground },
  gridDesc: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { color: '#D32F2F', fontWeight: '700', fontSize: 15 },
});
