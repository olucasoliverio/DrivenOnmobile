import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';

type Tab = 'extrato' | 'pagar' | 'receber';

export default function PagamentosScreen() {
  const { pagamentos } = useDriveOnData();
  const [tab, setTab] = useState<Tab>('extrato');

  const dados = tab === 'extrato'
    ? pagamentos
    : pagamentos.filter(p => p.tipo === (tab === 'pagar' ? 'pagar' : 'receber'));

  const total = dados.reduce((acc, p) => acc + (p.tipo === 'receber' ? p.valor : -p.valor), 0);
  const pendentes = dados.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'extrato', label: 'Extrato', icon: 'list-alt' },
    { key: 'pagar', label: 'A Pagar', icon: 'arrow-upward' },
    { key: 'receber', label: 'A Receber', icon: 'arrow-downward' },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <MaterialIcons name={t.icon as any} size={16} color={tab === t.key ? colors.primary : '#9E9E9E'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resumo */}
      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Saldo</Text>
          <Text style={[styles.resumoValue, { color: total >= 0 ? '#2E7D32' : '#D32F2F' }]}>
            R$ {Math.abs(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.resumoSep} />
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Pendente</Text>
          <Text style={[styles.resumoValue, { color: '#E65100' }]}>R$ {pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <FlatList
        data={dados}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 32 }}
        renderItem={({ item: p }) => {
          const isReceber = p.tipo === 'receber';
          const isPago = p.status === 'pago';
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: isReceber ? '#E8F5E9' : '#FFEBEE' }]}>
                  <MaterialIcons name={isReceber ? 'arrow-downward' : 'arrow-upward'} size={20} color={isReceber ? '#2E7D32' : '#D32F2F'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.desc}>{p.descricao}</Text>
                  <Text style={styles.data}>{dayjs(p.data).format('DD/MM/YYYY')}</Text>
                  {p.formaPagamento ? <Text style={styles.forma}>{p.formaPagamento}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.valor, { color: isReceber ? '#2E7D32' : '#D32F2F' }]}>
                    {isReceber ? '+' : '-'} R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: isPago ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.statusText, { color: isPago ? '#2E7D32' : '#E65100' }]}>
                      {isPago ? 'PAGO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>
              </View>
            </Surface>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: colors.primary },
  resumo: { flexDirection: 'row', backgroundColor: colors.primary, padding: spacing.lg },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  resumoValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  resumoSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  data: { fontSize: 12, color: '#757575', marginTop: 2 },
  forma: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  valor: { fontSize: 15, fontWeight: '800' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
