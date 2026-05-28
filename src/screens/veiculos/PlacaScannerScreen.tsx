import React, { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { borderRadius, colors, palette, spacing, shadows } from '../../theme/theme';
import { lookupPlate, PlateLookupResponse } from '../../services/licensePlateApi';
import {
  extractPlateCandidates,
  formatPlate,
  LicensePlateCandidate,
  validatePlate,
} from '../../services/licensePlateRecognition';
import { recognizePlateTextFromImage } from '../../services/plateOcrAdapter';
import ScreenHeader from '../../components/ScreenHeader';

export default function PlacaScannerScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ocrText, setOcrText] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<PlateLookupResponse | null>(null);

  const candidates = useMemo(() => extractPlateCandidates(ocrText), [ocrText]);
  const manualValidation = useMemo(() => validatePlate(selectedPlate), [selectedPlate]);
  const canLookup = manualValidation.isValid && !isLookingUp;

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const nextPermission = await requestPermission();

      if (!nextPermission.granted) {
        Alert.alert('Permissao necessaria', 'Autorize a camera para fazer a leitura da placa.');
        return;
      }
    }

    setIsCameraOpen(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isRecognizing) {
      return;
    }

    setIsRecognizing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const result = await recognizePlateTextFromImage(photo.uri);
      setOcrText(result.text);
      const [candidate] = extractPlateCandidates(result.text);
      if (candidate) {
        setSelectedPlate(candidate.plate);
      }
      setIsCameraOpen(false);
    } catch (error) {
      Alert.alert(
        'Leitura indisponivel',
        error instanceof Error ? error.message : 'Nao foi possivel reconhecer texto na imagem.',
      );
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSelectCandidate = (candidate: LicensePlateCandidate) => {
    setSelectedPlate(candidate.plate);
    setLookupResult(null);
  };

  const handleLookup = async () => {
    if (!manualValidation.isValid || !manualValidation.pattern) {
      Alert.alert('Placa invalida', 'Use o padrao AAA-1234 ou AAA1A23.');
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await lookupPlate({
        plate: manualValidation.plate,
        pattern: manualValidation.pattern,
        rawOcrText: ocrText,
      });
      setLookupResult(response);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleUseInSearch = () => {
    if (!manualValidation.isValid) {
      return;
    }

    navigation.navigate('Veiculos', { detectedPlate: manualValidation.plate });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Scanner de Placa" showBack={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.cameraPanel} elevation={1}>
        <View style={styles.panelIcon}>
          <MaterialIcons name="photo-camera" size={28} color={colors.primary} />
        </View>
        <View style={styles.panelText}>
          <Text style={styles.panelTitle}>Leitura por camera</Text>
          <Text style={styles.panelDescription}>Capture a placa e o Google ML Kit retorna o texto para o filtro local.</Text>
        </View>
        <Button mode="contained-tonal" onPress={handleOpenCamera} compact>
          Abrir camera
        </Button>
      </Surface>

      {isCameraOpen ? (
        <Surface style={styles.cameraSurface} elevation={1}>
          <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" mode="picture" />
          <View style={styles.cameraActions}>
            <Button mode="outlined" onPress={() => setIsCameraOpen(false)} textColor={palette.white}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleCapture} loading={isRecognizing} disabled={isRecognizing}>
              Capturar placa
            </Button>
          </View>
        </Surface>
      ) : null}

      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Texto OCR</Text>
        <RNTextInput
          value={ocrText}
          onChangeText={setOcrText}
          multiline
          placeholder="Cole aqui o texto retornado pelo ML Kit enquanto a camera nao estiver ligada..."
          placeholderTextColor={palette.slate400}
          style={styles.ocrInput}
          textAlignVertical="top"
        />
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Candidatas encontradas</Text>
        {candidates.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma placa no padrao antigo ou Mercosul.</Text>
        ) : (
          <View style={styles.candidateList}>
            {candidates.map(candidate => (
              <Button
                key={candidate.plate}
                mode={selectedPlate === candidate.plate ? 'contained' : 'outlined'}
                onPress={() => handleSelectCandidate(candidate)}
                icon="car"
                compact
              >
                {candidate.plate}
              </Button>
            ))}
          </View>
        )}
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Placa para consulta</Text>
        <RNTextInput
          value={selectedPlate}
          onChangeText={value => {
            setSelectedPlate(formatPlate(value));
            setLookupResult(null);
          }}
          autoCapitalize="characters"
          placeholder="AAA-1234 ou AAA1A23"
          placeholderTextColor={palette.slate400}
          style={[
            styles.plateInput,
            selectedPlate.length > 0 && !manualValidation.isValid && styles.plateInputInvalid,
          ]}
        />
        <View style={styles.statusRow}>
          <MaterialIcons
            name={manualValidation.isValid ? 'check-circle' : 'info'}
            size={16}
            color={manualValidation.isValid ? palette.emerald600 : palette.slate500}
          />
          <Text style={styles.statusText}>
            {manualValidation.isValid
              ? `Padrao ${manualValidation.pattern === 'old' ? 'antigo' : 'Mercosul'}`
              : 'Filtro local aguardando placa valida'}
          </Text>
        </View>
        <View style={styles.actionRow}>
          <Button mode="contained" onPress={handleLookup} disabled={!canLookup} loading={isLookingUp}>
            Consultar backend
          </Button>
          <Button mode="outlined" onPress={handleUseInSearch} disabled={!manualValidation.isValid}>
            Usar na busca
          </Button>
        </View>
      </Surface>

      {lookupResult ? (
        <Surface style={styles.resultPanel} elevation={1}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{lookupResult.plate}</Text>
            <View style={[
              styles.statusBadge,
              lookupResult.status === 'found' && styles.statusBadgeFound,
              lookupResult.status === 'error' && styles.statusBadgeError,
            ]}>
              <Text style={[
                styles.statusBadgeText,
                lookupResult.status === 'found' && styles.statusBadgeTextFound,
                lookupResult.status === 'error' && styles.statusBadgeTextError,
              ]}>
                {lookupResult.status === 'found' ? 'ENCONTRADA' : lookupResult.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.resultMessage}>{lookupResult.message}</Text>

          {(() => {
            const data = lookupResult.data as any;
            if (!data) return null;
            const vehicle = data.veiculo || data;
            const details = [];
            if (vehicle.marca) details.push({ label: 'Marca', value: vehicle.marca });
            if (vehicle.modelo) details.push({ label: 'Modelo', value: vehicle.modelo });
            if (vehicle.ano) details.push({ label: 'Ano', value: String(vehicle.ano) });
            if (vehicle.cor) details.push({ label: 'Cor', value: vehicle.cor });
            if (vehicle.placa && vehicle.placa !== lookupResult.plate) details.push({ label: 'Placa', value: vehicle.placa });

            if (details.length === 0) return null;

            return (
              <View style={styles.detailList}>
                {details.map((item, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}:</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </Surface>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  cameraPanel: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  panelIcon: {
    alignItems: 'center',
    backgroundColor: palette.navy50,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  panelText: { flex: 1 },
  panelTitle: { color: colors.onBackground, fontSize: 15, fontWeight: '700' },
  panelDescription: { color: palette.slate500, fontSize: 12, marginTop: 3 },
  section: { backgroundColor: palette.white, borderRadius: borderRadius.md, padding: spacing.md },
  cameraSurface: {
    backgroundColor: palette.slate900,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  cameraPreview: { aspectRatio: 3 / 4, width: '100%' },
  cameraActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  sectionTitle: { color: colors.onBackground, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  ocrInput: {
    backgroundColor: palette.slate50,
    borderColor: palette.slate200,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    color: colors.onBackground,
    minHeight: 120,
    padding: spacing.md,
  },
  emptyText: { color: palette.slate500, fontSize: 13 },
  candidateList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  plateInput: {
    borderColor: palette.slate200,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    color: colors.onBackground,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  plateInputInvalid: { borderColor: palette.rose600 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  statusText: { color: palette.slate500, fontSize: 12 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  resultPanel: { backgroundColor: palette.white, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: palette.slate200, ...shadows.sm },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  resultTitle: { color: palette.navy900, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: palette.slate100 },
  statusBadgeFound: { backgroundColor: '#E8F5E9' },
  statusBadgeError: { backgroundColor: '#FFEBEE' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: palette.slate500 },
  statusBadgeTextFound: { color: '#2E7D32' },
  statusBadgeTextError: { color: '#D32F2F' },
  resultMessage: { color: palette.slate500, fontSize: 13, marginBottom: spacing.sm },
  detailList: { backgroundColor: palette.slate50, borderRadius: borderRadius.sm, padding: spacing.md, borderWidth: 1, borderColor: '#ECEFF2' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ECEFF2' },
  detailLabel: { color: palette.slate500, fontSize: 13, fontWeight: '600' },
  detailValue: { color: palette.navy900, fontSize: 13, fontWeight: '700' },
});
