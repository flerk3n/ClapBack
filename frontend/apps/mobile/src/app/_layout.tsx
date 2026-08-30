import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { colors } from '@clapback/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MockAppProvider } from '@/state/mock-app-provider';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // Safety timer: don't block app start if fonts are slow in Expo Go
    const timer = setTimeout(() => setForceReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const isReady = fontsLoaded || Boolean(fontError) || forceReady;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <QueryClientProvider client={queryClient}>
          <MockAppProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.canvas },
                animation: 'fade_from_bottom',
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/profile" />
              <Stack.Screen name="onboarding/niches" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="acceptance/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="upload/[acceptanceId]" />
              <Stack.Screen name="submission/[id]" />
            </Stack>
          </MockAppProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
