import 'react-native-gesture-handler';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DriveOnDataProvider } from './src/context/DriveOnDataContext';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/theme/theme';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <DriveOnDataProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </DriveOnDataProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
