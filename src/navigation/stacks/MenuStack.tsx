import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../../screens/menu/MenuScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function MenuStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.white },
        headerTintColor: palette.slate700,
        headerTitleStyle: { fontWeight: '800', fontSize: 22, color: palette.slate900 },
        headerShadowVisible: false,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
