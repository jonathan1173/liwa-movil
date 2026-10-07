import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AuthBackground from '@/components/AuthBackground';
import { BibliotecaItem, getBibliotecaItems } from '@/lib/supabase';

export default function BibliotecaScreen() {
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<BibliotecaItem | null>(null);
  const [copied, setCopied] = useState(false);

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
      item.title_book.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inicio' as any);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedItem) {
          setSelectedItem(null);
          return true;
        }
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack, selectedItem])
  );

  async function handleDownload(item: BibliotecaItem) {
    if (!item.url_download) {
      Alert.alert('Aviso', 'El enlace de descarga no está disponible.');
      return;
    }

    try {
      setOpeningId(item.id);
      const supported = await Linking.canOpenURL(item.url_download);
      if (supported) {
        if (Platform.OS === 'web') {
          window.open(item.url_download, '_blank');
        } else {
          await WebBrowser.openBrowserAsync(item.url_download);
        }
      } else {
        await Linking.openURL(item.url_download);
      }
    } catch {
      try {
        await Linking.openURL(item.url_download);
      } catch {
        Alert.alert('Error', 'No se pudo abrir el archivo descargable.');
      }
    } finally {
      setOpeningId(null);
    }
  }

  async function handleCopyLink(item: BibliotecaItem) {
    if (!item.url_download) {
      Alert.alert('Aviso', 'El enlace de descarga no está disponible.');
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(item.url_download);
      } else {
        try {
          await Share.share({
            title: item.title_book,
            message: item.url_download,
            url: item.url_download,
          });
        } catch {
          // ignore share dismiss
        }
      }

      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.warn('Error al copiar o compartir enlace:', err);
    }
  }

  return (
    <AuthBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Barra superior de navegación */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
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
            renderItem={({ item }) => {
              const isDownloading = openingId === item.id;

              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => setSelectedItem(item)}
                >
                  {/* Imagen de portada con badge Digital */}
                  <View style={styles.cardImageWrapper}>
                    {item.url_image ? (
                      <Image
                        source={{ uri: item.url_image }}
                        style={styles.cardCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderCover}>
                        <Ionicons name="book-outline" size={54} color="#7C3AED" />
                      </View>
                    )}

                    {/* Badge "Digital" flotante */}
                    <View style={styles.digitalBadge}>
                      <Ionicons name="document-text-outline" size={13} color="#374151" />
                      <Text style={styles.digitalBadgeText}>Digital</Text>
                    </View>
                  </View>

                  {/* Título de la cartilla */}
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title_book}
                  </Text>

                  {/* Fila de acciones inferiores */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardDownloadBtn}
                      onPress={() => handleDownload(item)}
                      activeOpacity={0.85}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="download-outline" size={17} color="#FFFFFF" />
                          <Text style={styles.cardDownloadBtnText}>Descargar</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardExternalBtn}
                      onPress={() => handleDownload(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="open-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
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

        {/* Modal de Detalle del Libro */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedItem}
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedItem(null)}
            />

            <View style={styles.modalCard}>
              {/* Botón cerrar X */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedItem(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>

              {/* Portada centrada */}
              <View style={styles.modalCoverBox}>
                {selectedItem?.url_image ? (
                  <Image
                    source={{ uri: selectedItem.url_image }}
                    style={styles.modalCoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalCoverPlaceholder}>
                    <Ionicons name="book-outline" size={48} color="#7C3AED" />
                  </View>
                )}
              </View>

              {/* Badge "Libro Comunitario" */}
              <View style={styles.communityBadge}>
                <Ionicons name="sparkles" size={13} color="#5B21B6" />
                <Text style={styles.communityBadgeText}>Libro Comunitario</Text>
              </View>

              {/* Título */}
              <Text style={styles.modalTitle}>
                {selectedItem?.title_book}
              </Text>

              {/* Subtítulo / Descripción */}
              <Text style={styles.modalSubtitle}>
                Formato digital para lectura y consulta libre en la comunidad Liwa.
              </Text>

              {/* Botón Principal: Abrir o Descargar Libro */}
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => selectedItem && handleDownload(selectedItem)}
                disabled={selectedItem ? openingId === selectedItem.id : false}
              >
                {selectedItem && openingId === selectedItem.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryBtnText}>Abrir o Descargar Libro</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Botón Secundario: Copiar enlace de descarga */}
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                activeOpacity={0.8}
                onPress={() => selectedItem && handleCopyLink(selectedItem)}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color={copied ? '#10B981' : '#475569'}
                />
                <Text
                  style={[
                    styles.modalSecondaryBtnText,
                    copied && { color: '#10B981', fontWeight: '700' },
                  ]}
                >
                  {copied ? '¡Enlace copiado!' : 'Copiar enlace de descarga'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 36,
    gap: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardImageWrapper: {
    width: '100%',
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
  },
  digitalBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  digitalBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 14,
    lineHeight: 22,
    letterSpacing: -0.3,
    paddingHorizontal: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  cardDownloadBtn: {
    flex: 1,
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  cardExternalBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
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
  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCoverBox: {
    width: 140,
    height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
  },
  modalCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  communityBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5B21B6',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSecondaryBtnText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
  },
});
