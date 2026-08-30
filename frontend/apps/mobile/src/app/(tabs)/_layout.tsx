import { colors } from '@clapback/ui';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CreatorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'flame' : 'flame-outline'} size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'albums' : 'albums-outline'} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
