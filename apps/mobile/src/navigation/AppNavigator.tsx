import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAppStore } from '../store';
import {
  HomeScreen,
  TasksScreen,
  CalendarScreen,
  WellnessScreen,
  ChatScreen,
  ProfileScreen,
  LoginScreen,
} from '../screens';

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Calendar: undefined;
  Wellness: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<string, { active: string; inactive: string }> = {
  Home: { active: '🏠', inactive: '🏡' },
  Tasks: { active: '📋', inactive: '📝' },
  Calendar: { active: '📅', inactive: '🗓️' },
  Wellness: { active: '🧘', inactive: '🧘' },
  Chat: { active: '💬', inactive: '💭' },
  Profile: { active: '👤', inactive: '👤' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icons = tabIcons[routeName];
  return (
    <Text style={{ fontSize: 22 }}>
      {focused ? icons.active : icons.inactive}
    </Text>
  );
}

export function AppNavigator() {
  const { isAuthenticated, theme } = useAppStore();

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon routeName={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: theme.colors.tabActive,
          tabBarInactiveTintColor: theme.colors.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBar,
            borderTopColor: theme.colors.tabBarBorder,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Wellness" component={WellnessScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
