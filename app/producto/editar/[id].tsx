import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getProductById, supabase, updateProductDetails } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
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

interface Option {
  id: number;
  name: string;
}

const STATUS_OPTIONS: Option[] = [
  { id: 1, name: 'Activo' },
  { id: 2, name: 'Reservado' },
  { id: 3, name: 'Vendido' },
  { id: 4, name: 'Archivado' },
];

const STATUS_MAP: Record<string, string> = {
  active: 'Activo',
  reserved: 'Reservado',
  sold: 'Vendido',
  archived: 'Archivado',
};
const STATUS_VALUE_MAP: Record<string, string> = {
  Activo: 'active',
  Reservado: 'reserved',
  Vendido: 'sold',
  Archivado: 'archived',
};

// ─── Mini Picker ──────────────────────────────────────────────────────────────
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
                  onPress={() => { onSelect(item); setOpen(false); }}
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

// ─── Main Edit Screen ─────────────────────────────────────────────────────────
export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loadingProduct, setLoadingProduct] = useState(true);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Option | null>(null);
  const [condition, setCondition] = useState<Option | null>(null);
  const [status, setStatus] = useState<Option>(STATUS_OPTIONS[0]);

  // Catalogs
  const [categories, setCategories] = useState<Option[]>([]);
  const [conditions, setConditions] = useState<Option[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Submission
  const [saving, setSaving] = useState(false);
  const isSubmitting = useRef(false);

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');

  // Load catalogs
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

  // Load product data
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const product = await getProductById(Number(id));
        setTitle(product.title);
        setDescription(product.description ?? '');
        setPrice(String(product.price));

        if (product.category) {
          // Find matching catalog option by name (catalogs may not be loaded yet — we'll re-sync below)
          setCategory({ id: 0, name: product.category.name });
        }
        if (product.condition) {
          setCondition({ id: 0, name: product.condition.name });
        }

        const matchedStatus = STATUS_OPTIONS.find(
          (s) => STATUS_VALUE_MAP[s.name] === product.status
        );
        if (matchedStatus) setStatus(matchedStatus);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el producto');
        router.back();
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [id]);

  // Once catalogs and product name are available, resolve IDs
  useEffect(() => {
    if (loadingCatalogs || loadingProduct) return;
    setCategory((prev) => {
      if (!prev) return null;
      const match = categories.find((c) => c.name === prev.name);
      return match ?? prev;
    });
    setCondition((prev) => {
      if (!prev) return null;
      const match = conditions.find((c) => c.name === prev.name);
      return match ?? prev;
    });
  }, [loadingCatalogs, loadingProduct]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/producto/${id}` as any);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack]),
  );

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

  async function handleSave() {
    if (isSubmitting.current) return;
    if (!validate()) return;

    isSubmitting.current = true;
    setSaving(true);
    try {
      await updateProductDetails(Number(id), {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price.replace(',', '.')),
        category_id: category?.id && category.id !== 0 ? category.id : null,
        condition_id: condition?.id && condition.id !== 0 ? condition.id : null,
        status: STATUS_VALUE_MAP[status.name] ?? 'active',
      });
      Alert.alert('¡Listo!', 'Publicación actualizada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message ?? 'Inténtalo de nuevo');
    } finally {
      isSubmitting.current = false;
      setSaving(false);
    }
  }

  if (loadingProduct) {
    return (
      <SafeAreaView style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
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
            <TouchableOpacity style={styles.backCircle} onPress={handleBack} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={neumorphicStyles.title}>Editar publicación</Text>
            <View style={{ width: 42 }} />
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
                onChangeText={(t) => { setTitle(t); setTitleError(''); }}
                maxLength={80}
              />
            </View>
            {titleError ? <Text style={neumorphicStyles.errorText}>{titleError}</Text> : null}

            <View style={styles.gap} />

            <Text style={neumorphicStyles.label}>Precio</Text>
            <View style={[neumorphicStyles.inputContainer, priceError ? styles.inputErr : null]}>
              <Text style={styles.currency}>C$</Text>
              <TextInput
                style={neumorphicStyles.inputText}
                placeholder="0.00"
                placeholderTextColor={Colors.textPlaceholder}
                value={price}
                onChangeText={(t) => { setPrice(t); setPriceError(''); }}
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
            <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>Categorización</Text>

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

          {/* Estado */}
          <View style={[neumorphicStyles.card, styles.section]}>
            <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>Estado de la publicación</Text>
            <PickerField
              label="Estado"
              value={status}
              options={STATUS_OPTIONS}
              onSelect={setStatus}
              icon="toggle-outline"
            />
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[neumorphicStyles.button, styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color={Colors.white} size="small" />
                <Text style={[neumorphicStyles.buttonText, { marginLeft: 10 }]}>Guardando…</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={[neumorphicStyles.buttonText, { marginLeft: 8 }]}>Guardar cambios</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
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
  section: { marginHorizontal: 0 },
  gap: { height: 14 },
  inputErr: { borderColor: Colors.shadowDark, borderWidth: 1.5 },
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
  saveBtn: { marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Picker modal
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
  optRowSel: { backgroundColor: 'rgba(26,26,46,0.06)', borderRadius: 10 },
  optText: { color: Colors.textSecondary, fontSize: 15 },
  optTextSel: { color: Colors.accent, fontWeight: '700' },
});
