import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/lib/authContext';
import { UpdateModal } from '@/components/UpdateModal';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav fontsLoaded={loaded} />
    </AuthProvider>
  );
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isAuthenticated, isProfileCompleted, isLoading } = useAuth();

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        {/* Rutas de autenticación (Login, Registro, Completar Perfil) */}
        <Stack.Protected guard={!isAuthenticated || !isProfileCompleted}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Rutas autenticadas de la aplicación */}
        <Stack.Protected guard={isAuthenticated && isProfileCompleted}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="mis-publicaciones" options={{ headerShown: false }} />
          <Stack.Screen name="favoritos" options={{ headerShown: false }} />
          <Stack.Screen name="producto/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="producto/editar/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="trueque-inteligente" options={{ headerShown: false }} />
          <Stack.Screen name="mapa-vendedores" options={{ headerShown: false }} />
          <Stack.Screen name="ajustes-perfil" options={{ headerShown: false }} />
          <Stack.Screen name="comunidad/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="biblioteca" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
      <UpdateModal />
    </>
  );
}
