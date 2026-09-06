import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AuthBackground from '@/components/AuthBackground';
import { BibliotecaItem, getBibliotecaItems } from '@/lib/supabase';

// Colores alternados para los botones de descarga tal como se ve en la maqueta
const BUTTON_COLORS = ['#38BDF8', '#E07A5F', '#0284C7', '#EC006C'];

export default function BibliotecaScreen() {
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getBibliotecaItems();
      setItems(data);
    } catch (err) {
      console.warn('Error loading biblioteca items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) =>
      item.titulo.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  async function handleDownload(item: BibliotecaItem) {
    if (!item.archivo_url) {
      Alert.alert('Aviso', 'El enlace de descarga no está disponible.');
      return;
    }

    try {
      setOpeningId(item.id);
      const supported = await Linking.canOpenURL(item.archivo_url);
      if (supported) {
        if (Platform.OS === 'web') {
          window.open(item.archivo_url, '_blank');
        } else {
          await WebBrowser.openBrowserAsync(item.archivo_url);
        }
      } else {
        await Linking.openURL(item.archivo_url);
      }
    } catch {
      try {
        await Linking.openURL(item.archivo_url);
      } catch {
        Alert.alert('Error', 'No se pudo abrir el archivo descargable.');
      }
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <AuthBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Barra superior de navegación */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1E394B" />
          </TouchableOpacity>

          <View style={styles.topTitleContainer}>
            <Text style={styles.headerSubtitle}>BIBLIOTECA VIRTUAL</Text>
          </View>

          {/* Espacio para balancear el botón de atrás */}
          <View style={{ width: 40 }} />
        </View>

        {/* Título de la sección exactamente como en la maqueta */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Archivos Descargables</Text>
          <Text style={styles.mainSubtitle}>
            Consulta y descarga cartillas, guías y documentos educativos.
          </Text>
        </View>

        {/* Barra de búsqueda integrada */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título o tema..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Archivos */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Cargando biblioteca…</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
            }
            renderItem={({ item, index }) => {
              const btnColor = BUTTON_COLORS[index % BUTTON_COLORS.length];
              const isDownloading = openingId === item.id;

              return (
                <View style={styles.card}>
                  {/* Portada izquierda */}
                  <View style={styles.coverWrapper}>
                    {item.portada_url ? (
                      <Image
                        source={{ uri: item.portada_url }}
                        style={styles.coverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderCover}>
                        <Ionicons name="document-text" size={28} color="#E06A4E" />
                      </View>
                    )}
                  </View>

                  {/* Información central */}
                  <View style={styles.infoWrapper}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.titulo}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.tamano || '4 MB'}
                    </Text>
                  </View>

                  {/* Botón de Descargar a la derecha */}
                  <TouchableOpacity
                    style={[styles.downloadBtn, { backgroundColor: btnColor }]}
                    onPress={() => handleDownload(item)}
                    activeOpacity={0.82}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.downloadBtnText}>DESCARGAR</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={54} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Sin coincidencias' : 'No hay documentos aún'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No se encontró ningún archivo con el término "${searchQuery}".`
                    : 'Pronto se agregarán nuevas cartillas y guías descargables.'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  topTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1.2,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1E394B',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 19,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  coverWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F8',
  },
  infoWrapper: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E06A4E',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  downloadBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E394B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
});
