import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../../screens/menu/MenuScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function MenuStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.navy800 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
