import { Colors } from '@/constants/NeumorphicStyles';
import { getCategories, getConditions } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface FilterState {
  category: string | null;
  condition: string | null;
}

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

interface CategoryItem {
  id: number;
  name: string;
}

interface ConditionItem {
  id: number;
  name: string;
}

export default function ProductFilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: ProductFilterModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selecciones temporales mientras el modal está abierto
  const [tempCategory, setTempCategory] = useState<string | null>(filters.category);
  const [tempCondition, setTempCondition] = useState<string | null>(filters.condition);

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setTempCategory(filters.category);
      setTempCondition(filters.condition);
    }
  }, [visible, filters]);

  // Cargar catálogos desde Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadCatalogs() {
      try {
        const [cats, conds] = await Promise.all([
          getCategories(),
          getConditions(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setConditions(conds);
        }
      } catch (err) {
        console.warn('Error loading filter catalogs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearAll = () => {
    setTempCategory(null);
    setTempCondition(null);
  };

  const handleApply = () => {
    onApply({
      category: tempCategory,
      condition: tempCondition,
    });
    onClose();
  };

  const activeCount = (tempCategory ? 1 : 0) + (tempCondition ? 1 : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Manija de arrastre visual */}
          <View style={styles.dragHandle} />

          {/* Encabezado del modal */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Filtros</Text>
              <Text style={styles.headerSubtitle}>
                {activeCount > 0
                  ? activeCount + ' filtro' + (activeCount > 1 ? 's' : '') + ' seleccionado' + (activeCount > 1 ? 's' : '')
                  : 'Filtra por categoría o estado'}
              </Text>
            </View>

            <View style={styles.headerRightRow}>
              {activeCount > 0 && (
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={styles.resetBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetBtnText}>Restablecer</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.purple} />
              <Text style={styles.loadingText}>Cargando opciones...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Sección 1: Categoría ── */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIconBox}>
                    <Ionicons name="grid-outline" size={16} color={Colors.purple} />
                  </View>
                  <Text style={styles.sectionTitle}>Categoría</Text>
                </View>

                <View style={styles.chipsWrap}>
                  {/* Opción 'Todas' */}
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      tempCategory === null && styles.chipActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => setTempCategory(null)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempCategory === null && styles.chipTextActive,
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>

                  {categories.map((cat) => {
                    const isSelected = tempCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() =>
                          setTempCategory(isSelected ? null : cat.name)
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* ── Sección 2: Estado del producto ── */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#FDF2F8' }]}>
                    <Ionicons name="sparkles-outline" size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Estado del Producto</Text>
                </View>

                <View style={styles.chipsWrap}>
                  {/* Opción 'Todos' */}
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      tempCondition === null && styles.chipActiveAccent,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => setTempCondition(null)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempCondition === null && styles.chipTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>

                  {conditions.map((cond) => {
                    const isSelected = tempCondition === cond.name;
                    return (
                      <TouchableOpacity
                        key={cond.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActiveAccent,
                        ]}
                        activeOpacity={0.75}
                        onPress={() =>
                          setTempCondition(isSelected ? null : cond.name)
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {cond.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Botón de Aplicar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.85}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>
                {activeCount > 0
                  ? 'Aplicar filtros (' + activeCount + ')'
                  : 'Aplicar filtros'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13.5,
    color: '#6B7280',
    marginTop: 10,
  },
  scrollContent: {
    paddingVertical: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3EEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActiveAccent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applyBtn: {
    backgroundColor: Colors.purple,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
