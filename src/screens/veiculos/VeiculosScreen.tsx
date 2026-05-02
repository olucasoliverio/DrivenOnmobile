import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput as RNTextInput } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockVeiculos, mockClientes } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function VeiculosScreen() {
  const [busca, setBusca] = useState('');
  const veiculos = mockVeiculos.filter(v => {
    const cliente = mockClientes.find(c => c.id === v.clienteId);
    return v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(busca.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar por placa, modelo ou cliente..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={veiculos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: v }) => {
          const cliente = mockClientes.find(c => c.id === v.clienteId);
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={styles.carIcon}><MaterialIcons name="directions-car" size={28} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modelo}>{v.marca} {v.modelo} {v.ano}</Text>
                  <View style={styles.placaRow}>
                    <View style={styles.placaBadge}><Text style={styles.placaText}>{v.placa}</Text></View>
                    <Text style={styles.cor}>• {v.cor}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="person" size={13} color="#9E9E9E" />
                    <Text style={styles.clienteText}>{cliente?.nome ?? '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="speed" size={13} color="#9E9E9E" />
                    <Text style={styles.kmText}>{v.km.toLocaleString()} km</Text>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  carIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  modelo: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  placaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  placaBadge: { backgroundColor: '#37474F', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  placaText: { color: '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  cor: { fontSize: 12, color: '#757575' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  clienteText: { fontSize: 12, color: '#757575' },
  kmText: { fontSize: 12, color: '#757575' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
