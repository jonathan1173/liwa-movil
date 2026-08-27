import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { createCommunityPost, getCities, uploadCommunityImage } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Option {
  id: number;
  name: string;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({
  visible,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<'anuncio' | 'evento'>('anuncio');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [cities, setCities] = useState<Option[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCities();
    }
  }, [visible]);

  async function loadCities() {
    try {
      const list = await getCities();
      setCities(list);
    } catch {
      // silent
    }
  }

  async function handlePickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a tus fotos para adjuntar una imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Ingresa un título para tu publicación.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el contenido de tu publicación.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl: string | null = null;
      if (imageUri) {
        uploadedUrl = await uploadCommunityImage(imageUri);
      }

      await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        post_type: postType,
        image_url: uploadedUrl,
        city_id: selectedCity?.id ?? null,
      });

      Alert.alert('¡Publicado!', 'Tu publicación ha sido creada exitosamente.');
      // Reset form
      setTitle('');
      setContent('');
      setImageUri(null);
      setSelectedCity(null);
      setPostType('anuncio');

      onPostCreated();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo crear la publicación.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Nueva Publicación</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle-outline" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Tipo de publicación */}
            <Text style={neumorphicStyles.label}>Tipo de Publicación</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeChip,
                  postType === 'anuncio' && styles.typeChipActive,
                ]}
                onPress={() => setPostType('anuncio')}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={18}
                  color={postType === 'anuncio' ? Colors.white : Colors.textPrimary}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    postType === 'anuncio' && styles.typeChipTextActive,
                  ]}
                >
                  Anuncio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeChip,
                  postType === 'evento' && styles.typeChipActive,
                ]}
                onPress={() => setPostType('evento')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={postType === 'evento' ? Colors.white : Colors.accent}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    postType === 'evento' && styles.typeChipTextActive,
                  ]}
                >
                  Evento / Feria
                </Text>
              </TouchableOpacity>
            </View>

            {/* Título */}
            <Text style={neumorphicStyles.label}>Título</Text>
            <View style={neumorphicStyles.inputContainer}>
              <TextInput
                style={neumorphicStyles.inputText}
                placeholder={
                  postType === 'evento'
                    ? 'Ej: Gran Feria Artesanal este Sábado'
                    : 'Ej: Nuevo lote de empaques biodegradables'
                }
                placeholderTextColor={Colors.textPlaceholder}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Contenido */}
            <Text style={neumorphicStyles.label}>Descripción / Detalle</Text>
            <View style={[neumorphicStyles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[neumorphicStyles.inputText, styles.textArea]}
                placeholder="Escribe los detalles de tu anuncio o evento..."
                placeholderTextColor={Colors.textPlaceholder}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Ciudad opcional */}
            <Text style={neumorphicStyles.label}>Ciudad (Opcional)</Text>
            <TouchableOpacity
              style={neumorphicStyles.inputContainer}
              onPress={() => setShowCityPicker(true)}
            >
              <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
              <Text
                style={[
                  neumorphicStyles.inputText,
                  !selectedCity && { color: Colors.textPlaceholder },
                ]}
              >
                {selectedCity ? selectedCity.name : 'Todas las ciudades (General)'}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Adjuntar Imagen */}
            <Text style={neumorphicStyles.label}>Imagen (Opcional)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={32} color={Colors.accent} />
                <Text style={styles.uploadBoxText}>Agregar foto</Text>
              </TouchableOpacity>
            )}

            {/* Botón de Publicar */}
            <TouchableOpacity
              style={[neumorphicStyles.button, styles.submitBtn, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={neumorphicStyles.buttonText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Modal secundario de selección de Ciudad */}
          <Modal visible={showCityPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.cityOverlay}
              activeOpacity={1}
              onPress={() => setShowCityPicker(false)}
            >
              <View style={styles.cityCard}>
                <Text style={styles.cityTitle}>Selecciona Ciudad</Text>
                <TouchableOpacity
                  style={styles.cityOption}
                  onPress={() => {
                    setSelectedCity(null);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.cityOptionText, !selectedCity && { fontWeight: '700', color: Colors.accent }]}>
                    Todas las ciudades
                  </Text>
                </TouchableOpacity>
                {cities.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.cityOption}
                    onPress={() => {
                      setSelectedCity(c);
                      setShowCityPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        selectedCity?.id === c.id && { fontWeight: '700', color: Colors.accent },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scroll: {
    flexGrow: 0,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.shadowDark,
  },
  typeChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  textAreaContainer: {
    height: 110,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textArea: {
    height: '100%',
    width: '100%',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
    borderRadius: 14,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.05)',
    marginBottom: 16,
  },
  uploadBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  submitBtn: {
    marginTop: 12,
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  // City modal
  cityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  cityCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  cityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  cityOption: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.shadowDark,
  },
  cityOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
