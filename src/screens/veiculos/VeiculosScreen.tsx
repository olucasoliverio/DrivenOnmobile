import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TextInput as RNTextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, palette, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';

export default function VeiculosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { veiculos: veiculosData, clientes, deleteRecord, refresh, isLoading } = useDriveOnData();
  const { can } = useAuth();
  const [busca, setBusca] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    const detectedPlate = route.params?.detectedPlate;

    if (typeof detectedPlate === 'string') {
      setBusca(detectedPlate);
    }
  }, [route.params?.detectedPlate]);

  const veiculos = veiculosData.filter(v => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    return v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(busca.toLowerCase());
  });

  const remove = (id: number) => {
    Alert.alert('Remover veiculo?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/veiculos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };


  return (
    <View style={styles.container}>
      <ScreenHeader title="Veículos" showBack={true} />
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar por placa, modelo ou cliente..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={veiculos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
        }
        ListEmptyComponent={() => (
          isLoading ? (
            <LoadingState message="Carregando veiculos..." isFullPage />
          ) : (
            <EmptyState
              icon="directions-car"
              message={busca.length > 0 ? 'Nenhum veículo encontrado para esta busca' : 'Nenhum veículo cadastrado'}
              helper={busca.length > 0 ? 'Tente buscar por placa, modelo ou nome do cliente.' : 'Cadastre um veículo para abrir ordens de serviço e orçamentos.'}
              actionLabel={busca.length > 0 || !can('veiculos', 'create') ? undefined : 'Novo Veículo'}
              onAction={busca.length > 0 || !can('veiculos', 'create') ? undefined : () => navigation.navigate('VeiculoForm')}
              isFullPage
            />
          )
        )}
        renderItem={({ item: v, index }) => {
          const cliente = clientes.find(c => c.id === v.clienteId);
          const isFirst = index === 0;
          const isLast = index === veiculos.length - 1;
          return (
            <TouchableOpacity onPress={() => navigation.navigate('VeiculoDetalhes', { veiculoId: v.id })} activeOpacity={0.8}>
              <View style={[
                styles.listItem,
                isFirst && styles.listItemFirst,
                isLast && styles.listItemLast,
                !isLast && styles.listItemBorder
              ]}>
                <View style={styles.cardRow}>
                  <View style={styles.carIcon}>
                    <MaterialIcons name="directions-car" size={24} color={palette.slate700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modelo}>{v.marca} {v.modelo} {v.ano}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                      <View style={styles.placaBadge}><Text style={styles.placaText}>{v.placa}</Text></View>
                      <Text style={styles.cor}>• {v.cor}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="person" size={13} color={palette.slate500} />
                      <Text style={styles.clienteText}>{cliente?.nome ?? '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="speed" size={13} color={palette.slate500} />
                      <Text style={styles.kmText}>{v.km.toLocaleString('pt-BR')} km</Text>
                    </View>
                  </View>
                  {(can('veiculos', 'update') || can('veiculos', 'delete')) && (
                    <View style={styles.actionButtons}>
                      {can('veiculos', 'update') && (
                        <IconButton
                          icon="pencil-outline"
                          size={20}
                          iconColor={palette.navy800}
                          onPress={(event) => {
                            event.stopPropagation();
                            navigation.navigate('VeiculoForm', { veiculoId: v.id });
                          }}
                        />
                      )}
                      {can('veiculos', 'delete') && (
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          iconColor={palette.rose600}
                          onPress={(event) => {
                            event.stopPropagation();
                            remove(v.id);
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      {can('veiculos', 'create') && (
        <>
          <FAB icon="camera" style={styles.cameraFab} color="#FFF" onPress={() => navigation.navigate('PlacaScanner')} />
          <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => navigation.navigate('VeiculoForm')} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  listItem: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: palette.slate200,
  },
  listItemFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  listItemLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.sm,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionButtons: { flexDirection: 'row', alignItems: 'center', marginRight: -8 },
  carIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modelo: { fontSize: 15, fontWeight: '700', color: palette.slate900 },
  placaBadge: { backgroundColor: palette.slate700, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  placaText: { color: '#FFF', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  cor: { fontSize: 12, color: palette.slate500 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  clienteText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },
  kmText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
  cameraFab: { position: 'absolute', bottom: 84, right: 20, backgroundColor: colors.secondary, borderRadius: 16, elevation: 8 },
});
