import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AgendaScreen from '../../screens/agenda/AgendaScreen';
import { colors } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function AgendaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen name="AgendaList" component={AgendaScreen} options={{ title: 'Agenda' }} />
    </Stack.Navigator>
  );
}
