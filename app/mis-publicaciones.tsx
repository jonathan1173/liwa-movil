import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getMyProducts, getStates, Product, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── State badge config & Icon mapping ───────────────────────────────────────

const STATUS_STYLE_MAP: Record<string, { color: string; bg: string; icon: any }> = {
  Activo:    { color: '#2ecc71', bg: 'rgba(46,204,113,0.12)', icon: 'checkmark-circle-outline' },
  Apartado:  { color: '#f39c12', bg: 'rgba(243,156,18,0.12)', icon: 'time-outline' },
  'En espera': { color: '#e05c5c', bg: 'rgba(224,92,92,0.12)',  icon: 'hourglass-outline' },
};

function StatusBadge({ status }: { status?: string }) {
  const statusName = status ?? 'Activo';
  const cfg = STATUS_STYLE_MAP[statusName] ?? {
    color: Colors.accent,
    bg: 'rgba(142,68,173,0.12)',
    icon: 'pricetag-outline',
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{statusName}</Text>
    </View>
  );
}

// ─── Product Row Card ─────────────────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  const firstImage = product.images[0]?.url ?? null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/producto/${product.id}` as any)}
    >
      <View style={[neumorphicStyles.card, styles.rowCard]}>
        {/* Thumbnail */}
        <View style={styles.thumb}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image-outline" size={22} color={Colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.rowMeta}>
            {product.category && (
              <Text style={styles.rowCategory} numberOfLines={1}>
                {product.category.name}
              </Text>
            )}
            <StatusBadge status={product.status} />
          </View>

          <Text style={styles.rowPrice}>
            C${' '}
            {product.price.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ categoryName }: { categoryName?: string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="storefront-outline" size={40} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>
        {categoryName ? `Sin publicaciones ${categoryName}` : 'Sin publicaciones'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {categoryName
          ? `No tienes productos en la categoría "${categoryName}".`
          : 'Aún no has publicado ningún producto.\n¡Empieza a vender ahora!'}
      </Text>
      <TouchableOpacity
        style={[neumorphicStyles.button, styles.publishBtn]}
        onPress={() => router.replace('/(tabs)/publicar' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.white} style={{ marginRight: 8 }} />
        <Text style={neumorphicStyles.buttonText}>Publicar producto</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stats bar & Filter Cards ──────────────────────────────────────────────────

function StatsBar({
  statesList,
  products,
  selectedState,
  onSelectState,
}: {
  statesList: { id: number; name: string }[];
  products: Product[];
  selectedState: string | null;
  onSelectState: (stateName: string | null) => void;
}) {
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    const key = p.status ?? 'Activo';
    return { ...acc, [key]: (acc[key] ?? 0) + 1 };
  }, {});

  return (
    <View style={styles.statsRow}>
      {statesList.map((st) => {
        const isSelected = selectedState === st.name;
        const styleInfo = STATUS_STYLE_MAP[st.name] ?? {
          color: Colors.accent,
          bg: 'rgba(142,68,173,0.12)',
          icon: 'pricetag-outline',
        };
        return (
          <TouchableOpacity
            key={st.id}
            activeOpacity={0.8}
            style={[
              neumorphicStyles.card,
              styles.statCard,
              isSelected && { borderColor: styleInfo.color, borderWidth: 2 },
            ]}
            onPress={() => onSelectState(isSelected ? null : st.name)}
          >
            <Ionicons name={styleInfo.icon} size={20} color={styleInfo.color} />
            <Text style={[styles.statCount, { color: styleInfo.color }]}>
              {counts[st.name] ?? 0}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {st.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Category Tabs ───────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { id: 0, label: 'Todos' },
  { id: 1, label: 'Activos' },
  { id: 2, label: 'Inactivos' },
  { id: 3, label: 'Pendientes' },
];

function CategoryTabsBar({
  selectedTab,
  onSelectTab,
}: {
  selectedTab: number;
  onSelectTab: (id: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
    >
      {CATEGORY_TABS.map((tab) => {
        const isSelected = selectedTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.8}
            style={[
              styles.tabPill,
              isSelected && styles.tabPillActive,
            ]}
          >
            <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MisPublicacionesScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbStates, setDbStates] = useState<{ id: number; name: string }[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0 = Todos, 1 = Activos, 2 = Inactivos, 3 = Pendientes

  async function fetchProducts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [prodsData, statesRes] = await Promise.all([
        getMyProducts(user.id),
        getStates(),
      ]);

      setProducts(prodsData);
      setDbStates(statesRes.length > 0 ? statesRes : [
        { id: 1, name: 'Activo' },
        { id: 2, name: 'Apartado' },
        { id: 3, name: 'En espera' },
      ]);
    } catch (err: any) {
      console.warn('Error al cargar publicaciones o estados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/perfil' as any);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack]),
  );

  const filteredProducts = selectedState
    ? products.filter((p) => (p.status ?? 'Activo').toLowerCase() === selectedState.toLowerCase())
    : products;

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProducts(true)}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={handleBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[neumorphicStyles.title, styles.pageTitle]}>Mis Ventas</Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}

        {!loading && (
          <>
            <StatsBar
              statesList={dbStates}
              products={products}
              selectedState={selectedState}
              onSelectState={setSelectedState}
            />

            {/* Section label */}
            <Text style={styles.sectionLabel}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'publicación' : 'publicaciones'}
              {selectedState ? ` (${selectedState})` : ''}
            </Text>

            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => <ProductRow key={p.id} product={p} />)
            ) : (
              <EmptyState categoryName={selectedState ?? undefined} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
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
    elevation: 6,
  },
  pageTitle: {
    marginBottom: 0,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },

  // Stats bar
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
    marginHorizontal: 0,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Category Tabs
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Row card
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 5,
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowCategory: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  rowPrice: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chevron: {
    flexShrink: 0,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
