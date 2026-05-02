import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../../screens/dashboard/HomeScreen';
import { colors } from '../../theme/theme';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
}
