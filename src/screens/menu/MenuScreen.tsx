import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';

interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: string;
  desc: string;
}

const menuItems: MenuItem[] = [
  { 
    icon: 'people',          
    label: 'Clientes',      
    screen: 'Clientes',      
    desc: 'Visualizar e gerenciar clientes' 
  },
  { 
    icon: 'directions-car',  
    label: 'Veículos',      
    screen: 'Veiculos',      
    desc: 'Visualizar e cadastrar veículos' 
  },
  { 
    icon: 'event',  
    label: 'Agenda',      
    screen: 'Agenda',      
    desc: 'Visualizar compromissos e agendamentos' 
  },
  { 
    icon: 'request-quote',  
    label: 'Orçamentos',      
    screen: 'Orcamentos',      
    desc: 'Gerenciar orçamentos e propostas' 
  },
  { 
    icon: 'attach-money',  
    label: 'Contas a Receber',
    screen: 'Financeiro',      
    desc: 'Controle de contas a receber' 
  },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { configuracoes } = useDriveOnData();
  const initials = React.useMemo(() => {
    if (!user?.nome) return 'AD';
    const parts = user.nome.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.nome.substring(0, 2).toUpperCase();
  }, [user?.nome]);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.screen === 'Agenda') {
      return configuracoes?.recursosAdicionais?.agenda !== false;
    }
    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 96 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Card com Gradiente ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}>
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

      {/* ── Lista de Opções (Menu Redesenhado) ── */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Cadastros e Registros</Text>
        <View style={styles.listCard}>
          {filteredMenuItems.map((item, index) => {
            const isLast = index === filteredMenuItems.length - 1;
            return (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.listItem,
                  !isLast && styles.listItemBorder
                ]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <MaterialIcons name={item.icon} size={22} color={palette.slate700} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Seção de Logout ── */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconBox}>
            <MaterialIcons name="logout" size={20} color={palette.rose600} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.logoutText}>Sair da conta</Text>
            <Text style={styles.logoutDesc}>Encerrar a sessão ativa</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={palette.rose600} />
        </TouchableOpacity>
      </View>

      {/* ── Custom Confirm Logout Modal ── */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContent}>
            <View style={[styles.dialogIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
              <MaterialIcons name="logout" size={32} color={palette.rose600} />
            </View>
            
            <Text style={styles.dialogTitle}>Deseja sair do aplicativo?</Text>
            <Text style={styles.dialogDescription}>
              Você será desconectado da sua conta ativa e precisará informar seu e-mail e senha no próximo acesso.
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  signOut();
                }}
              >
                <LinearGradient
                  colors={[palette.rose600, '#DC2626']}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Sim, Sair</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: palette.slate100 
  },
  contentContainer: {
    flexGrow: 1,
  },

  // Profile Header
  profileHeader: { 
    paddingBottom: spacing.xl, 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  profileHeaderCircle: { 
    position: 'absolute', 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    top: -60, 
    right: -60 
  },
  avatarCircle: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  avatarText: { 
    color: palette.white, 
    fontWeight: '800', 
    fontSize: 24 
  },
  userName: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: palette.white, 
    marginBottom: 4 
  },
  userEmail: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.55)', 
    marginBottom: spacing.sm 
  },
  perfilBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(245,158,11,0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(245,158,11,0.3)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: borderRadius.full 
  },
  perfilText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: palette.amber400, 
    letterSpacing: 0.5 
  },

  // Menu List Container
  menuContainer: { 
    padding: spacing.md, 
    paddingTop: spacing.lg 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: palette.slate500, 
    marginBottom: spacing.sm, 
    letterSpacing: 0.8, 
    textTransform: 'uppercase' 
  },
  listCard: { 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    borderWidth: 1, 
    borderColor: palette.slate200, 
    overflow: 'hidden',
    ...shadows.sm 
  },
  listItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    backgroundColor: palette.white 
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md 
  },
  itemContent: { 
    flex: 1 
  },
  itemLabel: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: palette.navy900 
  },
  itemDesc: { 
    fontSize: 12, 
    color: palette.slate500, 
    marginTop: 2 
  },

  // Logout Section
  logoutSection: { 
    paddingHorizontal: spacing.md, 
    paddingTop: spacing.xs 
  },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    borderWidth: 1, 
    borderColor: '#FEE2E2',
    ...shadows.sm 
  },
  logoutIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FEF2F2', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md 
  },
  logoutText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: palette.rose600 
  },
  logoutDesc: { 
    fontSize: 12, 
    color: '#F87171', 
    marginTop: 2 
  },
  // Confirm Dialog Modal Styles
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialogContent: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  dialogIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  dialogActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  dialogCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate700,
  },
  dialogConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  dialogConfirmButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },
});
