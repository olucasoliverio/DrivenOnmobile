import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClientesScreen from '../../screens/clientes/ClientesScreen';

const Stack = createNativeStackNavigator();

export default function ClientesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientesList" component={ClientesScreen} />
    </Stack.Navigator>
  );
}
