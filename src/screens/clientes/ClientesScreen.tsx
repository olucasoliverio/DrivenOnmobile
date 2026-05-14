import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';

// Cores de avatar por índice (rotação)
const AVATAR_COLORS = [
  [palette.navy800, palette.navy600],
  ['#7C3AED', '#A855F7'],
  ['#059669', '#10B981'],
  ['#DC2626', '#F87171'],
  ['#D97706', '#FBBF24'],
] as [string, string][];

export default function ClientesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { clientes: clientesData, veiculos, ordens } = useDriveOnData();
  const [busca, setBusca] = useState('');

  const clientes = clientesData.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    c.cpf.includes(busca)
  );

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <Text style={styles.headerSub}>{clientesData.length} cadastrado{clientesData.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {/* ── Search (overlapping) ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={palette.slate400} />
          <RNTextInput
            placeholder="Buscar cliente, CPF, telefone..."
            value={busca}
            onChangeText={setBusca}
            style={styles.searchInput}
            placeholderTextColor={palette.slate400}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialIcons name="close" size={18} color={palette.slate400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Lista ── */}
      <FlatList
        data={clientes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={56} color={palette.slate200} />
            <Text style={styles.emptyTitle}>Nenhum cliente</Text>
            <Text style={styles.emptyText}>Tente ajustar a busca</Text>
          </View>
        )}
        renderItem={({ item: cliente, index }) => {
          const veiculosCount = veiculos.filter(v => v.clienteId === cliente.id).length;
          const ordensCount = ordens.filter(o => o.clienteId === cliente.id).length;
          const avatarColors = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
              activeOpacity={0.7}
            >
              <View style={styles.card}>
                {/* Avatar com gradiente */}
                <LinearGradient colors={avatarColors} style={styles.avatar}>
                  <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
                </LinearGradient>

                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nome}>{cliente.nome}</Text>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={12} color={palette.slate400} />
                        <Text style={styles.infoText}>{cliente.telefone}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={palette.slate300} />
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <MaterialIcons name="directions-car" size={13} color={palette.navy800} />
                      <Text style={styles.statText}>{veiculosCount} veículo{veiculosCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: palette.amber50, borderColor: palette.amber100 }]}>
                      <MaterialIcons name="build" size={13} color="#92400E" />
                      <Text style={[styles.statText, { color: '#92400E' }]}>{ordensCount} OS</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: palette.slate50, borderColor: palette.slate200 }]}>
                      <MaterialIcons name="location-city" size={13} color={palette.slate500} />
                      <Text style={[styles.statText, { color: palette.slate500 }]}>{cliente.cidade}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <FAB icon="plus" style={styles.fab} color={palette.white} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  topHeader: { paddingBottom: 20, paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 22, fontWeight: '800', color: palette.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  searchContainer: { marginHorizontal: spacing.lg, marginTop: -16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 12, gap: spacing.sm, ...shadows.md },
  searchInput: { flex: 1, fontSize: 14, color: palette.slate900 },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 90, gap: spacing.sm, marginTop: spacing.sm },

  card: { backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.md, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', ...shadows.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: palette.white, fontWeight: '800', fontSize: 16 },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  nome: { fontSize: 15, fontWeight: '700', color: palette.slate900, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: palette.slate500 },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.navy50, borderWidth: 1, borderColor: palette.navy100, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statText: { fontSize: 11, fontWeight: '600', color: palette.navy800 },

  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.slate700 },
  emptyText: { fontSize: 14, color: palette.slate400 },

  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: palette.navy800 },
});
