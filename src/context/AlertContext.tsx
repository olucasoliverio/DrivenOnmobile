import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, type AlertButton, TouchableOpacity } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { palette } from '../theme/theme';

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

const AlertContext = createContext<{
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}>({
  showAlert: () => {},
});

let globalAlertRef: ((title: string, message?: string, buttons?: AlertButton[]) => void) | null = null;

// Monkeypatch react-native Alert.alert globally
const originalAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: AlertButton[], options?: any) => {
  if (globalAlertRef) {
    globalAlertRef(title, message, buttons);
  } else {
    originalAlert(title, message, buttons, options);
  }
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    globalAlertRef = (title, message, buttons) => {
      setState({
        visible: true,
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      });
    };
    return () => {
      globalAlertRef = null;
    };
  }, []);

  const hideDialog = () => {
    setState((prev) => ({ ...prev, visible: false }));
  };

  // Helper to determine icon and color based on title and message
  const getAlertStyle = () => {
    const textToAnalyze = (state.title + ' ' + (state.message || '')).toLowerCase();
    
    if (textToAnalyze.includes('sucesso') || textToAnalyze.includes('salvo') || textToAnalyze.includes('confirmado')) {
      return {
        icon: 'check-circle' as const,
        color: '#10B981', // emerald green
        bg: '#ECFDF5',
      };
    }
    if (textToAnalyze.includes('excluir') || textToAnalyze.includes('remover') || textToAnalyze.includes('cancelar') || textToAnalyze.includes('erro') || textToAnalyze.includes('falha') || textToAnalyze.includes('parar')) {
      return {
        icon: 'error' as const,
        color: '#EF4444', // red
        bg: '#FEF2F2',
      };
    }
    if (textToAnalyze.includes('atenção') || textToAnalyze.includes('aviso') || textToAnalyze.includes('alerta')) {
      return {
        icon: 'warning' as const,
        color: '#F59E0B', // amber yellow
        bg: '#FEF3C7',
      };
    }
    // Default info style
    return {
      icon: 'info' as const,
      color: palette.navy800 || '#0F172A',
      bg: palette.navy50 || '#F8FAFC',
    };
  };

  const alertStyle = getAlertStyle();

  // Sort buttons so the cancel action is always rendered last (at the bottom of our stacked layout)
  const sortedButtons = [...state.buttons].sort((a, b) => {
    if (a.style === 'cancel') return 1;
    if (b.style === 'cancel') return -1;
    return 0;
  });

  return (
    <AlertContext.Provider value={{ showAlert: (t, m, b) => globalAlertRef?.(t, m, b) }}>
      {children}
      <Portal>
        <Dialog
          visible={state.visible}
          onDismiss={hideDialog}
          dismissable={false}
          style={styles.dialog}
        >
          <View style={styles.dialogContainer}>
            {/* Centered Decorative Icon Circle */}
            <View style={[styles.iconCircle, { backgroundColor: alertStyle.bg }]}>
              <MaterialIcons name={alertStyle.icon} size={24} color={alertStyle.color} />
            </View>

            {/* Bold Centered Title */}
            <Text style={styles.headerTitle}>{state.title}</Text>

            {/* Message Text with generous line height */}
            {state.message ? (
              <Text style={styles.messageText}>{state.message}</Text>
            ) : null}

            {/* Premium Full-Width Stacked Buttons */}
            <View style={styles.buttonContainer}>
              {sortedButtons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive' || 
                  (state.title + ' ' + (state.message || '')).toLowerCase().includes('excluir');
                
                const btnBg = isCancel 
                  ? 'transparent' 
                  : (isDestructive ? '#EF4444' : (palette.navy800 || '#0F172A'));

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      hideDialog();
                      if (btn.onPress) btn.onPress();
                    }}
                    activeOpacity={0.8}
                    style={isCancel ? styles.cancelButton : [styles.primaryButton, { backgroundColor: btnBg }]}
                  >
                    <Text style={isCancel ? styles.cancelButtonText : styles.primaryButtonText}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Dialog>
      </Portal>
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '85%',
    maxWidth: 300,
  },
  dialogContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A', // slate900
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  messageText: {
    fontSize: 13,
    color: '#64748B', // slate500
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 6,
  },
  primaryButton: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B', // slate500
  },
});
