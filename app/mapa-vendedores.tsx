import AppHeader from '@/components/AppHeader';
import { Colors } from '@/constants/NeumorphicStyles';
import { getMyProducts, getSellerLocations, Product, SellerLocation } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function MapaVendedoresScreen() {
  const insets = useSafeAreaInsets();
  const [sellers, setSellers] = useState<SellerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerLocation | null>(null);

  // Estados para los productos del vendedor seleccionado y paginación (2x2 = 4 por página)
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSellerLocations();
        setSellers(data);
      } catch (err) {
        console.warn('Error loading seller locations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cargar productos del vendedor cuando se selecciona uno
  useEffect(() => {
    if (!selectedSeller) {
      setSellerProducts([]);
      setCurrentPage(1);
      return;
    }

    async function loadSellerProducts() {
      setLoadingProducts(true);
      setCurrentPage(1);
      try {
        const prods = await getMyProducts(selectedSeller!.id);
        setSellerProducts(prods);
      } catch (err) {
        console.warn('Error loading products for seller:', err);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadSellerProducts();
  }, [selectedSeller]);

  // Coordenadas iniciales por defecto (Honduras - Tegucigalpa)
  const defaultLat = sellers.length > 0 ? sellers[0].latitude : 14.0723;
  const defaultLng = sellers.length > 0 ? sellers[0].longitude : -87.1921;

  // Generación de marcadores HTML personalizados sin el marcador azul por defecto (solo la etiqueta de username)
  const markersScript = sellers
    .map(
      (s) => `
        var customIcon = L.divIcon({
          className: 'custom-username-pin',
          html: '<div class="username-box">@${s.username || s.full_name || 'vendedor'}</div>',
          iconSize: [100, 30],
          iconAnchor: [50, 15]
        });

        var m = L.marker([${s.latitude}, ${s.longitude}], { icon: customIcon }).addTo(map);

        m.on('click', function(e) {
          if (e && e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          var data = JSON.stringify({ id: "${s.id}" });
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(data);
          } else if (window.parent) {
            window.parent.postMessage(data, '*');
          }
        });
      `
    )
    .join('\n');

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
          .custom-username-pin {
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .username-box {
            background-color: #3B1E54;
            color: #ffffff;
            font-weight: 700;
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 20px;
            border: 2px solid #ffffff;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
          }
          .username-box:active {
            transform: scale(0.95);
            background-color: #2A153E;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${defaultLat}, ${defaultLng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          ${markersScript}
        </script>
      </body>
    </html>
  `;

  function onMapMessage(event: any) {
    try {
      const rawData = typeof event?.nativeEvent?.data === 'string' ? event.nativeEvent.data : '';
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data && data.id) {
        const found = sellers.find((s) => s.id === data.id);
        if (found) {
          setSelectedSeller(found);
        }
      }
    } catch (e) {
      console.warn('Map message parse error:', e);
    }
  }

  function handleCallSeller(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsAppSeller(phone: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Mapa de Vendedores" showBack={true} showNotif={true} />

      {/* Contenido del mapa */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Cargando ubicaciones de vendedores…</Text>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <iframe
              srcDoc={mapHtml}
              style={styles.iframeMap}
              title="Mapa de Vendedores"
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.webContainer}
              onMessage={onMapMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}
        </View>
      )}

      {/* Modal / Tarjeta con detalles del Vendedor al hacer clic en un punto */}
      <Modal
        visible={selectedSeller !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSeller(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedSeller(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sellerCardModal}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.sellerAvatarBox}>
                <Ionicons name="storefront" size={28} color={Colors.white} />
              </View>
              <View style={styles.sellerMainInfo}>
                <Text style={styles.sellerName}>
                  {selectedSeller?.full_name || 'Vendedor sin nombre'}
                </Text>
                {selectedSeller?.username ? (
                  <Text style={styles.sellerUsername}>@{selectedSeller.username}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setSelectedSeller(null)}>
                <Ionicons name="close-circle" size={26} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoDivider} />

            {selectedSeller?.city?.name ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={Colors.accent} />
                <Text style={styles.infoText}>Ciudad: {selectedSeller.city.name}</Text>
              </View>
            ) : null}

            {selectedSeller?.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={Colors.accent} />
                <Text style={styles.infoText}>Teléfono: {selectedSeller.phone}</Text>
              </View>
            ) : null}

            <View style={styles.coordsBadge}>
              <Ionicons name="navigate-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.coordsBadgeText}>
                Lat: {selectedSeller?.latitude.toFixed(4)} | Lng: {selectedSeller?.longitude.toFixed(4)}
              </Text>
            </View>

            {/* Acciones de Contacto */}
            {selectedSeller?.phone ? (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsAppSeller(selectedSeller.phone!)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
                  onPress={() => handleCallSeller(selectedSeller.phone!)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call" size={18} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Llamar</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.infoDivider} />

            {/* Mostrador de Productos del Vendedor (2 x 2 con paginación) */}
            <View style={styles.productsSectionHeader}>
              <Text style={styles.productsSectionTitle}>Productos en venta</Text>
              {sellerProducts.length > 0 ? (
                <Text style={styles.productsCountText}>
                  {sellerProducts.length} producto{sellerProducts.length > 1 ? 's' : ''}
                </Text>
              ) : null}
            </View>

            {loadingProducts ? (
              <View style={styles.loadingProductsBox}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.loadingProductsText}>Cargando productos…</Text>
              </View>
            ) : sellerProducts.length === 0 ? (
              <View style={styles.noProductsBox}>
                <Ionicons name="bag-remove-outline" size={28} color={Colors.textSecondary} />
                <Text style={styles.noProductsText}>Este vendedor aún no ha publicado productos</Text>
              </View>
            ) : (
              <>
                {/* Grilla 2 x 2 de productos */}
                <View style={styles.productGrid2x2}>
                  {sellerProducts
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((prod) => {
                      const imgUrl = prod.images[0]?.url ?? null;
                      return (
                        <TouchableOpacity
                          key={prod.id}
                          style={styles.gridProductCard}
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedSeller(null);
                            router.push(`/producto/${prod.id}` as any);
                          }}
                        >
                          <View style={styles.gridImageWrapper}>
                            {imgUrl ? (
                              <Image source={{ uri: imgUrl }} style={styles.gridImage} resizeMode="cover" />
                            ) : (
                              <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
                            )}
                          </View>
                          <Text style={styles.gridProductTitle} numberOfLines={2}>
                            {prod.title}
                          </Text>
                          <Text style={styles.gridProductPrice}>
                            C$ {prod.price.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Paginación si hay más de 4 productos */}
                {sellerProducts.length > ITEMS_PER_PAGE ? (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? Colors.textPlaceholder : Colors.textPrimary} />
                      <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Anterior</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicatorText}>
                      Pág. {currentPage} de {Math.ceil(sellerProducts.length / ITEMS_PER_PAGE)}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.pageBtn,
                        currentPage >= Math.ceil(sellerProducts.length / ITEMS_PER_PAGE) && styles.pageBtnDisabled,
                      ]}
                      disabled={currentPage >= Math.ceil(sellerProducts.length / ITEMS_PER_PAGE)}
                      onPress={() =>
                        setCurrentPage((p) => Math.min(Math.ceil(sellerProducts.length / ITEMS_PER_PAGE), p + 1))
                      }
                    >
                      <Text
                        style={[
                          styles.pageBtnText,
                          currentPage >= Math.ceil(sellerProducts.length / ITEMS_PER_PAGE) && styles.pageBtnTextDisabled,
                        ]}
                      >
                        Siguiente
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                          currentPage >= Math.ceil(sellerProducts.length / ITEMS_PER_PAGE)
                            ? Colors.textPlaceholder
                            : Colors.textPrimary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  mapWrapper: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
  },
  iframeMap: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sellerCardModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 12,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sellerMainInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sellerUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
  },
  coordsBadgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  // Estilos del mostrador 2x2 de productos
  productsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  productsCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingProductsBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingProductsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  noProductsBox: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  noProductsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  productGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridProductCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 8,
    elevation: 3,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 4,
  },
  gridImageWrapper: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridProductTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 15,
    minHeight: 30,
  },
  gridProductPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent,
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageBtnTextDisabled: {
    color: Colors.textPlaceholder,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
