import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getSellerLocations, SellerLocation } from '@/lib/supabase';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MapaVendedoresScreen() {
  const insets = useSafeAreaInsets();
  const [sellers, setSellers] = useState<SellerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerLocation | null>(null);

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
      {/* Header flotante con inset para evitar notch/cámara */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Vendedores</Text>
        <View style={{ width: 40 }} />
      </View>

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
});
