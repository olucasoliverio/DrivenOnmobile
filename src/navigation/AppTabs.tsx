import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, shadows } from '../theme/theme';

// Stacks
import HomeStack from './stacks/HomeStack';
import AgendaStack from './stacks/AgendaStack';
import TarefasStack from './stacks/TarefasStack';
import MenuStack from './stacks/MenuStack';

const Tab = createBottomTabNavigator();

type IconName = keyof typeof MaterialIcons.glyphMap;

const TABS: { name: string; label: string; icon: IconName; component: any }[] = [
  { name: 'Dashboard', label: 'Início',   icon: 'home',    component: HomeStack },
  { name: 'Agenda',    label: 'Agenda',   icon: 'event',   component: AgendaStack },
  { name: 'OS',        label: 'Ordens',   icon: 'build',   component: TarefasStack },
  { name: 'Mais',      label: 'Mais',     icon: 'grid-view', component: MenuStack },
];

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.navy800,
        tabBarInactiveTintColor: palette.slate400,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={focused ? palette.white : color}
              />
            </View>
          );
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: palette.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 82 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...shadows.md,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: palette.navy800,
  },
});
