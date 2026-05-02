import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Stacks
import HomeStack from './stacks/HomeStack';
import AgendaStack from './stacks/AgendaStack';
import TarefasStack from './stacks/TarefasStack';
import MenuStack from './stacks/MenuStack';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Dashboard: 'dashboard',
            Agenda: 'event',
            'Ordens de Serviço': 'build',
            Mais: 'menu',
          };
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeStack} />
      <Tab.Screen name="Agenda" component={AgendaStack} />
      <Tab.Screen name="Ordens de Serviço" component={TarefasStack} />
      <Tab.Screen name="Mais" component={MenuStack} />
    </Tab.Navigator>
  );
}
