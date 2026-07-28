import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import {
    addProductImage,
    createProduct,
    supabase,
    uploadProductImage,
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const MAX_IMAGES = 5;

interface Option {
  id: number;
  name: string;
}

// ─── Mini Picker Component ───────────────────────────────────────────────────
function PickerField({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Selecciona...',
  icon = 'chevron-down-outline',
}: {
  label: string;
  value: Option | null;
  options: Option[];
  onSelect: (o: Option) => void;
  placeholder?: string;
  icon?: any;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Text style={neumorphicStyles.label}>{label}</Text>
      <TouchableOpacity
        style={neumorphicStyles.inputContainer}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={[neumorphicStyles.inputText, !value && { color: Colors.textPlaceholder }]}>
          {value ? value.name : placeholder}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optRow, value?.id === item.id && styles.optRowSel]}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optText, value?.id === item.id && styles.optTextSel]}>
                    {item.name}
                  </Text>
                  {value?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Image Slot Component ───────────────────────────────────────────────────
function ImageSlot({
  uri,
  index,
  onAdd,
  onRemove,
}: {
  uri: string | null;
  index: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  if (uri) {
    return (
      <View style={styles.imageSlot}>
        <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{index + 1}</Text>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
          <Ionicons name="close-circle" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[styles.imageSlot, styles.emptySlot]} onPress={onAdd} activeOpacity={0.8}>
      <Ionicons name="add" size={28} color={Colors.textSecondary} />
      <Text style={styles.slotLabel}>Foto</Text>
    </TouchableOpacity>
  );
}

// ─── Main Publicar Screen ────────────────────────────────────────────────────
export default function PublicarScreen() {
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Option | null>(null);
  const [condition, setCondition] = useState<Option | null>(null);

  const [categories, setCategories] = useState<Option[]>([]);
  const [conditions, setConditions] = useState<Option[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const isSubmitting = useRef(false);

  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');

  // Load Categories & Conditions
  useEffect(() => {
    async function load() {
      try {
        const [cats, conds] = await Promise.all([
          supabase.from('category').select('id, name').order('name'),
          supabase.from('product_condition').select('id, name').order('name'),
        ]);
        setCategories(cats.data ?? []);
        setConditions(conds.data ?? []);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los catálogos');
      } finally {
        setLoadingCatalogs(false);
      }
    }
    load();
  }, []);

  const pickImage = useCallback(async (slotIndex: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para añadir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => {
        const next = [...prev];
        next[slotIndex] = result.assets[0].uri;
        return next;
      });
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      const filled = next.filter(Boolean);
      while (filled.length < MAX_IMAGES) filled.push(null);
      return filled as (string | null)[];
    });
  }, []);

  function validate() {
    let ok = true;
    setTitleError('');
    setPriceError('');
    if (!title.trim()) {
      setTitleError('El título es requerido');
      ok = false;
    }
    const parsed = parseFloat(price.replace(',', '.'));
    if (!price.trim() || isNaN(parsed) || parsed < 0) {
      setPriceError('Ingresa un precio válido (ej: 150.00)');
      ok = false;
    }
    return ok;
  }

  async function handlePublish() {
    if (isSubmitting.current) return;
    if (!validate()) return;

    isSubmitting.current = true;
    setPublishing(true);

    try {
      const filledImages = images.filter(Boolean) as string[];

      // 1. Crear el producto
      setUploadProgress('Creando publicación…');
      const productId = await createProduct({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price.replace(',', '.')),
        category_id: category?.id ?? null,
        condition_id: condition?.id ?? null,
      });

      // 2. Subir las imágenes
      const failedImages: number[] = [];
      for (let i = 0; i < filledImages.length; i++) {
        try {
          setUploadProgress(`Subiendo imagen ${i + 1} de ${filledImages.length}…`);
          const publicUrl = await uploadProductImage(filledImages[i], productId, i);
          await addProductImage(productId, publicUrl, i);
        } catch (imgErr: any) {
          console.warn(`Image ${i + 1} upload failed:`, imgErr);
          failedImages.push(i + 1);
        }
      }

      // 3. Volver a Inicio
      router.replace('/(tabs)/inicio' as any);

      if (failedImages.length > 0) {
        setTimeout(() => {
          Alert.alert(
            'Producto publicado',
            `El producto se publicó, pero la(s) imagen(es) ${failedImages.join(', ')} no se pudieron subir.`
          );
        }, 600);
      }
    } catch (err: any) {
      isSubmitting.current = false;
      Alert.alert('Error al publicar', err.message ?? 'Inténtalo de nuevo');
    } finally {
      setPublishing(false);
      setUploadProgress('');
    }
  }

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={neumorphicStyles.title}>Nueva publicación</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Fotos */}
          <View style={[neumorphicStyles.card, styles.section]}>
            <Text style={[neumorphicStyles.label, { marginBottom: 12 }]}>
              Fotos ({images.filter(Boolean).length}/{MAX_IMAGES})
            </Text>
            <View style={styles.imageGrid}>
              {images.map((uri, idx) => (
                <ImageSlot
                  key={idx}
                  uri={uri}
                  index={idx}
                  onAdd={() => pickImage(idx)}
                  onRemove={removeImage}
                />
              ))}
            </View>
            <Text style={styles.imageHint}>
              La primera foto será la portada.
            </Text>
          </View>

          {/* Información */}
          <View style={[neumorphicStyles.card, styles.section]}>
            <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>
              Información del producto
            </Text>

            <Text style={neumorphicStyles.label}>Título</Text>
            <View style={[neumorphicStyles.inputContainer, titleError ? styles.inputErr : null]}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={neumorphicStyles.inputText}
                placeholder="¿Qué vendes?"
                placeholderTextColor={Colors.textPlaceholder}
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setTitleError('');
                }}
                maxLength={80}
              />
            </View>
            {titleError ? <Text style={neumorphicStyles.errorText}>{titleError}</Text> : null}

            <View style={styles.gap} />

            <Text style={neumorphicStyles.label}>Precio (Q)</Text>
            <View style={[neumorphicStyles.inputContainer, priceError ? styles.inputErr : null]}>
              <Text style={styles.currency}>Q</Text>
              <TextInput
                style={neumorphicStyles.inputText}
                placeholder="0.00"
                placeholderTextColor={Colors.textPlaceholder}
                value={price}
                onChangeText={(t) => {
                  setPrice(t);
                  setPriceError('');
                }}
                keyboardType="decimal-pad"
              />
            </View>
            {priceError ? <Text style={neumorphicStyles.errorText}>{priceError}</Text> : null}

            <View style={styles.gap} />

            <Text style={neumorphicStyles.label}>Descripción</Text>
            <View style={[neumorphicStyles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[neumorphicStyles.inputText, styles.textArea]}
                placeholder="Describe el estado, detalles, etc."
                placeholderTextColor={Colors.textPlaceholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </View>

          {/* Categorización */}
          <View style={[neumorphicStyles.card, styles.section]}>
            <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>
              Categorización
            </Text>

            {loadingCatalogs ? (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
            ) : (
              <>
                <PickerField
                  label="Categoría"
                  value={category}
                  options={categories}
                  onSelect={setCategory}
                  placeholder="Selecciona categoría"
                  icon="grid-outline"
                />
                <View style={styles.gap} />
                <PickerField
                  label="Condición"
                  value={condition}
                  options={conditions}
                  onSelect={setCondition}
                  placeholder="Nuevo, Usado, etc."
                  icon="layers-outline"
                />
              </>
            )}
          </View>

          {/* Botón Publicar */}
          <TouchableOpacity
            style={[neumorphicStyles.button, styles.publishBtn, publishing && styles.btnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <View style={styles.publishingRow}>
                <ActivityIndicator color={Colors.white} size="small" />
                <Text style={[neumorphicStyles.buttonText, { marginLeft: 10 }]}>
                  {uploadProgress || 'Publicando…'}
                </Text>
              </View>
            ) : (
              <View style={styles.publishingRow}>
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
                <Text style={[neumorphicStyles.buttonText, { marginLeft: 8 }]}>
                  Publicar producto
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SLOT_SIZE = 96;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginHorizontal: 0,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  emptySlot: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.shadowDark,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  orderBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.white,
    borderRadius: 11,
  },
  imageHint: {
    color: Colors.textPlaceholder,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  gap: { height: 14 },
  inputErr: {
    borderColor: Colors.shadowDark,
    borderWidth: 1.5,
  },
  currency: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    minHeight: 110,
  },
  textArea: {
    flex: 1,
    minHeight: 90,
    marginLeft: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  sep: { height: 1, backgroundColor: Colors.shadowDark, opacity: 0.2 },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 8,
  },
  optRowSel: {
    backgroundColor: 'rgba(26,26,46,0.06)',
    borderRadius: 10,
  },
  optText: { color: Colors.textSecondary, fontSize: 15 },
  optTextSel: { color: Colors.accent, fontWeight: '700' },
  publishBtn: {
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  publishingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});