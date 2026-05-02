import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput as RNTextInput } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockEstoque } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function EstoqueScreen() {
  const [busca, setBusca] = useState('');
  const itens = mockEstoque.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase()) || e.categoria.toLowerCase().includes(busca.toLowerCase()));
  const baixoEstoque = itens.filter(e => e.quantidade <= e.estoqueMinimo);

  return (
    <View style={styles.container}>
      {baixoEstoque.length > 0 && (
        <View style={styles.alertaBanner}>
          <MaterialIcons name="warning" size={18} color="#E65100" />
          <Text style={styles.alertaText}>{baixoEstoque.length} item(ns) com estoque baixo</Text>
        </View>
      )}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar item ou categoria..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={itens}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: e }) => {
          const isBaixo = e.quantidade <= e.estoqueMinimo;
          const isSemEstoque = e.quantidade === 0;
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: isSemEstoque ? '#FFEBEE' : isBaixo ? '#FFF3E0' : '#E8F5E9' }]}>
                  <MaterialIcons name="inventory-2" size={24} color={isSemEstoque ? '#D32F2F' : isBaixo ? '#E65100' : '#2E7D32'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{e.nome}</Text>
                  <View style={styles.categoriaRow}>
                    <View style={styles.categoriaBadge}><Text style={styles.categoriaText}>{e.categoria}</Text></View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.qtd, { color: isSemEstoque ? '#D32F2F' : isBaixo ? '#E65100' : '#2E7D32' }]}>
                    {e.quantidade} {e.unidade}
                  </Text>
                  <Text style={styles.valorUnit}>R$ {e.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                  {isBaixo && <Text style={styles.minimoText}>Mín: {e.estoqueMinimo}</Text>}
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
  alertaBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF3E0', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#FFE0B2' },
  alertaText: { fontSize: 13, color: '#E65100', fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground },
  categoriaRow: { marginTop: 4 },
  categoriaBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  categoriaText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  qtd: { fontSize: 18, fontWeight: '800' },
  valorUnit: { fontSize: 12, color: '#757575', marginTop: 2 },
  minimoText: { fontSize: 10, color: '#E65100', marginTop: 2 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
