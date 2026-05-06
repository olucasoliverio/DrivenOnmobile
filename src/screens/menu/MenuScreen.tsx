import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';

interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: string;
  color: string;
  bg: string;
  desc: string;
}

const menuItems: MenuItem[] = [
  { icon: 'people',          label: 'Clientes',      screen: 'Clientes',      color: palette.navy800,    bg: palette.navy50,      desc: 'Carteira de clientes' },
  { icon: 'directions-car',  label: 'Veículos',      screen: 'Veiculos',      color: '#0891B2',          bg: '#ECFEFF',           desc: 'Frota cadastrada' },
  { icon: 'request-quote',   label: 'Orçamentos',    screen: 'Orcamentos',    color: '#D97706',          bg: palette.amber50,     desc: 'Propostas e aprovações' },
  { icon: 'payments',        label: 'Pagamentos',    screen: 'Pagamentos',    color: palette.emerald600, bg: palette.emerald100,  desc: 'Contas e extrato' },
  { icon: 'inventory',       label: 'Estoque',       screen: 'Estoque',       color: palette.violet600,  bg: '#F5F3FF',           desc: 'Peças e produtos' },
  { icon: 'local-shipping',  label: 'Fornecedores',  screen: 'Fornecedores',  color: '#EA580C',          bg: '#FFF7ED',           desc: 'Parceiros e contatos' },
  { icon: 'handyman',        label: 'Serviços',      screen: 'Servicos',      color: '#475569',          bg: palette.slate100,    desc: 'Tabela de serviços' },
  { icon: 'bar-chart',       label: 'Relatórios',    screen: 'Relatorios',    color: '#15803D',          bg: '#F0FDF4',           desc: 'Análises e métricas' },
  { icon: 'settings',        label: 'Configurações', screen: 'Configuracoes', color: '#374151',          bg: '#F9FAFB',           desc: 'Dados da oficina' },
  { icon: 'manage-accounts', label: 'Usuários',      screen: 'Usuarios',      color: '#9D174D',          bg: '#FFF1F2',           desc: 'Equipe e permissões' },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const initials = user?.nome?.substring(0, 2).toUpperCase() ?? 'AD';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Profile Card com Gradiente ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileHeaderCircle} />
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.nome ?? 'Administrador'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? 'admin@driveon.com'}</Text>
        <View style={styles.perfilBadge}>
          <MaterialIcons name="verified" size={11} color={palette.amber400} />
          <Text style={styles.perfilText}>{user?.perfil?.toUpperCase() ?? 'ADMIN'}</Text>
        </View>
      </LinearGradient>

      {/* ── Grid de Módulos ── */}
      <View style={styles.gridSection}>
        <Text style={styles.sectionTitle}>Módulos</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.gridItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.gridCard, { backgroundColor: item.bg }]}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                  <MaterialIcons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={[styles.gridLabel, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.gridDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Botão Sair ── */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
          <View style={styles.logoutIcon}>
            <MaterialIcons name="logout" size={18} color={palette.rose600} />
          </View>
          <Text style={styles.logoutText}>Sair da conta</Text>
          <MaterialIcons name="chevron-right" size={20} color={palette.rose600} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Profile Header
  profileHeader: { paddingBottom: spacing.xl, alignItems: 'center', overflow: 'hidden' },
  profileHeaderCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -60 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: palette.white, fontWeight: '800', fontSize: 22 },
  userName: { fontSize: 18, fontWeight: '800', color: palette.white, marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: spacing.sm },
  perfilBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: borderRadius.full },
  perfilText: { fontSize: 11, fontWeight: '700', color: palette.amber400, letterSpacing: 0.5 },

  // Grid
  gridSection: { padding: spacing.lg, paddingBottom: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: palette.slate500, marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '47%' },
  gridCard: { borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.sm },
  iconBox: { width: 48, height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  gridLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  gridDesc: { fontSize: 11, color: palette.slate400, lineHeight: 15 },

  // Logout
  logoutSection: { padding: spacing.lg, paddingTop: spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: '#FECDD3', gap: spacing.sm },
  logoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFE4E6', justifyContent: 'center', alignItems: 'center' },
  logoutText: { flex: 1, color: palette.rose600, fontWeight: '700', fontSize: 15 },
});
