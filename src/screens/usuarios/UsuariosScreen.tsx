import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

const perfilConfig: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: '#1565C0' },
  mecanico: { label: 'Mecânico', color: '#E65100' },
  atendente: { label: 'Atendente', color: '#2E7D32' },
};

export default function UsuariosScreen() {
  const { usuarios } = useDriveOnData();

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: u }) => {
          const perfil = perfilConfig[u.perfil] ?? { label: u.perfil, color: '#757575' };
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: perfil.color }]}>
                  <Text style={styles.avatarText}>{u.nome.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{u.nome}</Text>
                  <View style={styles.infoRow}><MaterialIcons name="email" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{u.email}</Text></View>
                  <View style={styles.infoRow}><MaterialIcons name="phone" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{u.telefone}</Text></View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: perfil.color + '15' }]}>
                      <Text style={[styles.badgeText, { color: perfil.color }]}>{perfil.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: u.status === 'ativo' ? '#E8F5E9' : '#FFEBEE' }]}>
                      <Text style={[styles.badgeText, { color: u.status === 'ativo' ? '#2E7D32' : '#D32F2F' }]}>
                        {u.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Surface>
          );
        }}
      />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  infoText: { fontSize: 12, color: '#757575' },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
