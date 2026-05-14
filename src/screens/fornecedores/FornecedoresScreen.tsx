import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput as RNTextInput } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

export default function FornecedoresScreen() {
  const { fornecedores: fornecedoresData } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const fornecedores = fornecedoresData.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) || f.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar fornecedor..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={fornecedores}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: f }) => (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}><MaterialIcons name="local-shipping" size={24} color={colors.secondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{f.nome}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{f.categoria}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="phone" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.telefone}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="email" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.email}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="location-city" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.cidade}</Text></View>
              </View>
            </View>
          </Surface>
        )}
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
  cardRow: { flexDirection: 'row', gap: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  badgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  infoText: { fontSize: 12, color: '#757575' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
