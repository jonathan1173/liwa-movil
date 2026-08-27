import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationPickerModalProps {
  visible: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
}

export default function LocationPickerModal({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onSelectLocation,
}: LocationPickerModalProps) {
  const [lat, setLat] = useState<string>(
    initialLatitude !== undefined && initialLatitude !== null ? String(initialLatitude) : '12.1363'
  );
  const [lng, setLng] = useState<string>(
    initialLongitude !== undefined && initialLongitude !== null ? String(initialLongitude) : '-86.2513'
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (initialLatitude !== undefined && initialLatitude !== null) {
        setLat(String(initialLatitude));
      }
      if (initialLongitude !== undefined && initialLongitude !== null) {
        setLng(String(initialLongitude));
      }
    }
  }, [visible, initialLatitude, initialLongitude]);

  async function handleGetCurrentLocation() {
    setLocating(true);
    setError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso denegado. Permite el acceso a la ubicación en los ajustes.');
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLat = location.coords.latitude.toFixed(6);
      const newLng = location.coords.longitude.toFixed(6);
      setLat(newLat);
      setLng(newLng);
    } catch (err: any) {
      console.warn('Location error:', err);
      setError('No se pudo obtener la ubicación GPS actual.');
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setError('Ingresa una latitud válida (-90 a 90)');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setError('Ingresa una longitud válida (-180 a 180)');
      return;
    }

    setError('');
    onSelectLocation(parsedLat, parsedLng);
    onClose();
  }

  const currentLatNum = parseFloat(lat) || 14.0723;
  const currentLngNum = parseFloat(lng) || -87.1921;

  // Mapa OpenStreetMap Leaflet interactivo cargado vía WebView nativo o Web
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${currentLatNum}, ${currentLngNum}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var marker = L.marker([${currentLatNum}, ${currentLngNum}], { draggable: true }).addTo(map);

          function sendCoords(lat, lng) {
            var data = JSON.stringify({ lat: lat, lng: lng });
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(data);
            } else if (window.parent) {
              window.parent.postMessage(data, '*');
            }
          }

          marker.on('dragend', function (e) {
            var coord = e.target.getLatLng();
            sendCoords(coord.lat.toFixed(6), coord.lng.toFixed(6));
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendCoords(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
          });
        </script>
      </body>
    </html>
  `;

  function onMapMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.lat && data.lng) {
        setLat(String(data.lat));
        setLng(String(data.lng));
        setError('');
      }
    } catch (e) {
      console.warn('Map message parse error:', e);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="location" size={24} color={Colors.accent} />
              <Text style={styles.title}>Ubicación del Local</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

         

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Current Location Button */}
            <TouchableOpacity
              style={styles.currentLocBtn}
              onPress={handleGetCurrentLocation}
              disabled={locating}
              activeOpacity={0.8}
              testID="location-get-current-button"
            >
              {locating ? (
                <ActivityIndicator size="small" color={Colors.accent} style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="navigate-circle-outline" size={22} color={Colors.accent} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.currentLocBtnText}>
                {locating ? 'Obteniendo ubicación GPS…' : 'Utilizar mi ubicación actual'}
              </Text>
            </TouchableOpacity>

            {/* Interactive Map Preview */}
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <iframe
                  srcDoc={mapHtml}
                  style={styles.mapIframe}
                  title="Mapa de Ubicación"
                />
              ) : (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: mapHtml }}
                  style={styles.mapWebView}
                  onMessage={onMapMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Manual Lat/Lng inputs */}
            {/* <Text style={neumorphicStyles.label}>Coordenadas de tu local</Text> */}
            {/* <View style={styles.coordsRow}>
              <View style={styles.coordField}>
                <Text style={styles.coordLabel}>Latitud</Text>
                <View style={neumorphicStyles.inputContainer}>
                  <TextInput
                    style={neumorphicStyles.inputText}
                    value={lat}
                    onChangeText={(t) => { setLat(t); setError(''); }}
                    keyboardType="numeric"
                    placeholder="14.0723"
                    placeholderTextColor={Colors.textPlaceholder}
                    testID="location-lat-input"
                  />
                </View>
              </View>

              <View style={styles.coordField}>
                <Text style={styles.coordLabel}>Longitud</Text>
                <View style={neumorphicStyles.inputContainer}>
                  <TextInput
                    style={neumorphicStyles.inputText}
                    value={lng}
                    onChangeText={(t) => { setLng(t); setError(''); }}
                    keyboardType="numeric"
                    placeholder="-87.1921"
                    placeholderTextColor={Colors.textPlaceholder}
                    testID="location-lng-input"
                  />
                </View>
              </View>
            </View> */}

            {error ? <Text style={neumorphicStyles.errorText}>{error}</Text> : null}

            {/* Selected Location Summary Card */}
            <View style={styles.previewCard}>
              <Ionicons name="location-sharp" size={28} color={Colors.accent} />
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewTitle}>Ubicación elegida</Text>
                <Text style={styles.previewCoords}>
                  Lat: {lat || '--'} | Lng: {lng || '--'}
                </Text>
              </View>
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={[neumorphicStyles.button, styles.confirmBtn]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              testID="location-confirm-button"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={neumorphicStyles.buttonText}>Confirmar Ubicación</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  currentLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    marginBottom: 16,
  },
  currentLocBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  mapContainer: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  coordField: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 14,
    borderRadius: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewCoords: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: Platform.OS === 'ios' ? 16 : 0,
  },
});
