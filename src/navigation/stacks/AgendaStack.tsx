import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AgendaScreen from '../../screens/agenda/AgendaScreen';
import { palette } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function AgendaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgendaList" component={AgendaScreen} />
    </Stack.Navigator>
  );
}
