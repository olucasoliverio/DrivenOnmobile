import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mockClientes, mockVeiculos, mockOrdens } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function ClientesScreen() {
  const navigation = useNavigation<any>();
  const [busca, setBusca] = useState('');

  const clientes = mockClientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    c.cpf.includes(busca)
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput
          placeholder="Buscar cliente, CPF, telefone..."
          value={busca}
          onChangeText={setBusca}
          style={styles.searchInput}
          placeholderTextColor="#BDBDBD"
        />
      </View>

      <FlatList
        data={clientes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        )}
        renderItem={({ item: cliente }) => {
          const veiculosCount = mockVeiculos.filter(v => v.clienteId === cliente.id).length;
          const ordensCount = mockOrdens.filter(o => o.clienteId === cliente.id).length;
          return (
            <TouchableOpacity onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}>
              <Surface style={styles.card} elevation={1}>
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{cliente.nome}</Text>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="phone" size={13} color="#9E9E9E" />
                      <Text style={styles.infoText}>{cliente.telefone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="credit-card" size={13} color="#9E9E9E" />
                      <Text style={styles.infoText}>{cliente.cpf}</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
                </View>
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <MaterialIcons name="directions-car" size={14} color={colors.primary} />
                    <Text style={styles.statText}>{veiculosCount} veículo(s)</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialIcons name="build" size={14} color={colors.secondary} />
                    <Text style={styles.statText}>{ordensCount} OS</Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialIcons name="location-city" size={14} color="#9E9E9E" />
                    <Text style={styles.statText}>{cliente.cidade}</Text>
                  </View>
                </View>
              </Surface>
            </TouchableOpacity>
          );
        }}
      />

      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  infoText: { fontSize: 12, color: '#757575' },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#757575' },
  empty: { alignItems: 'center', marginTop: 80, gap: spacing.md },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
