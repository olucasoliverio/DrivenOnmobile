import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockServicos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';

const categoriaCores: Record<string, string> = {
  'Revisão': '#1565C0',
  'Rodagem': '#0097A7',
  'Freios': '#D32F2F',
  'Diagnóstico': '#6A1B9A',
  'Motor': '#E65100',
  'Suspensão': '#37474F',
};

export default function ServicosScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockServicos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: s }) => {
          const cor = categoriaCores[s.categoria] ?? colors.primary;
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.colorBar, { backgroundColor: cor }]} />
                <View style={{ flex: 1, paddingLeft: spacing.sm }}>
                  <View style={styles.header}>
                    <Text style={styles.nome}>{s.nome}</Text>
                    <Text style={styles.valor}>R$ {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                  </View>
                  <Text style={styles.descricao} numberOfLines={2}>{s.descricao}</Text>
                  <View style={styles.footer}>
                    <View style={[styles.badge, { backgroundColor: cor + '15' }]}>
                      <Text style={[styles.badgeText, { color: cor }]}>{s.categoria}</Text>
                    </View>
                    <View style={styles.tempoRow}>
                      <MaterialIcons name="schedule" size={13} color="#9E9E9E" />
                      <Text style={styles.tempo}>{s.tempoEstimado}</Text>
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
  card: { borderRadius: borderRadius.md, backgroundColor: '#FFF', overflow: 'hidden', flexDirection: 'row' },
  cardRow: { flexDirection: 'row', flex: 1 },
  colorBar: { width: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingTop: spacing.md, paddingRight: spacing.md },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground, flex: 1 },
  valor: { fontSize: 16, fontWeight: '800', color: colors.primary },
  descricao: { fontSize: 12, color: '#757575', paddingRight: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md, paddingRight: spacing.md },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  tempoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tempo: { fontSize: 12, color: '#9E9E9E' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
