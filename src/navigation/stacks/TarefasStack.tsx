import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TarefasScreen from '../../screens/tarefas/TarefasScreen';

const Stack = createNativeStackNavigator();

export default function TarefasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OSList" component={TarefasScreen} />
    </Stack.Navigator>
  );
}
