import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, shadows, colors } from '../theme/theme';

// Stacks
import HomeStack from './stacks/HomeStack';
import TarefasStack from './stacks/TarefasStack';
import MenuStack from './stacks/MenuStack';

const Tab = createBottomTabNavigator();

type IconName = keyof typeof MaterialIcons.glyphMap;

const TABS: { name: string; label: string; icon: IconName; component: any }[] = [
  { name: 'Dashboard', label: 'Início', icon: 'home',  component: HomeStack },
  { name: 'OS',        label: 'Ordens', icon: 'build', component: TarefasStack },
  { name: 'Menu',      label: 'Menu',   icon: 'menu',  component: MenuStack },
];

const ACTIVE_COLOR   = colors.primary;
const INACTIVE_COLOR = palette.slate400;
const FLASH_COLOR    = `${colors.primary}15`;

// ── Botão customizado ─────────────────────────────────────────────────────────
// Usa EXATAMENTE o `style` que o React Navigation injeta (não mescla com nada)
// para preservar o layout nativo correto (posição, largura, alinhamento).
// O flash é um View absoluteFill irmão dos children — sem overflow:hidden.
function TabButton({
  onPress,
  onLongPress,
  children,
  style,                // ← layout nativo do RN Navigation (width, flex, position…)
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
}: any) {
  const flash = useRef(new Animated.Value(0)).current;

  const animIn  = () => Animated.timing(flash, { toValue: 1, duration: 60,  useNativeDriver: false }).start();
  const animOut = () => Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: false }).start();

  const bgColor = flash.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', FLASH_COLOR],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={animIn}
      onPressOut={animOut}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: FLASH_COLOR, borderless: false }}
      // style puro do RN Navigation: preserva flex:1 e largura correta
      style={style}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: bgColor }]}
      />
      {/* View interno centraliza sem afetar o layout externo */}
      <View style={styles.tabInner}>
        {children}
      </View>
    </Pressable>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const bottomMargin = Platform.OS === 'ios' ? insets.bottom || 16 : 12;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: bottomMargin }],
        tabBarShowLabel: true,
        tabBarButton: (props) => <TabButton {...props} />,
        tabBarLabel: ({ focused, children }) => (
          <Text style={[styles.label, focused && styles.labelActive]}>
            {children}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          return (
            <View style={styles.iconWrapper}>
              <View style={[styles.activeBar, focused && styles.activeBarVisible]} />
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderTopWidth: 0,
    height: 68,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    elevation: 16,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  tabBarItem: {
    flex: 1,
    height: 68,
  },
  // View interno: centraliza conteúdo sem afetar layout do Pressable
  tabInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBar: {
    position: 'absolute',
    top: -12,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeBarVisible: {
    backgroundColor: ACTIVE_COLOR,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: INACTIVE_COLOR,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '700',
  },
});
