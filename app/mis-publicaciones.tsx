import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getMyProducts, Product, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Activo',    color: '#2ecc71', bg: 'rgba(46,204,113,0.12)' },
  reserved: { label: 'Reservado', color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
  sold:     { label: 'Vendido',   color: '#e05c5c', bg: 'rgba(224,92,92,0.12)'  },
  archived: { label: 'Archivado', color: Colors.textSecondary, bg: 'rgba(0,0,0,0.06)' },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status ?? ''] ?? STATUS_CONFIG.archived;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
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
          <Text style={styles.rowTitle} numberOfLines={2}>{product.title}</Text>

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

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="storefront-outline" size={40} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Sin publicaciones</Text>
      <Text style={styles.emptySubtitle}>
        Aún no has publicado ningún producto.{'\n'}¡Empieza a vender ahora!
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

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ products }: { products: Product[] }) {
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    const key = p.status ?? 'active';
    return { ...acc, [key]: (acc[key] ?? 0) + 1 };
  }, {});
  const stats = [
    { key: 'active',   label: 'Activos',    icon: 'checkmark-circle-outline' as const },
    { key: 'reserved', label: 'apartado', icon: 'time-outline' as const },
    { key: 'sold',     label: 'Vendidos',   icon: 'bag-check-outline' as const },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map(({ key, label, icon }) => (
        <View key={key} style={[neumorphicStyles.card, styles.statCard]}>
          <Ionicons
            name={icon}
            size={20}
            color={STATUS_CONFIG[key].color}
          />
          <Text style={[styles.statCount, { color: STATUS_CONFIG[key].color }]}>
            {counts[key] ?? 0}
          </Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MisPublicacionesScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchProducts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getMyProducts(user.id);
      setProducts(data);
    } catch {
      // silent — show empty state
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
          <TouchableOpacity
            style={styles.backCircle}
            onPress={handleBack}
            activeOpacity={0.85}
          >
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

        {/* Stats + List */}
        {!loading && products.length > 0 && (
          <>
            <StatsBar products={products} />

            <Text style={styles.sectionLabel}>
              {products.length} {products.length === 1 ? 'publicación' : 'publicaciones'}
            </Text>

            {products.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && <EmptyState />}
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
    marginBottom: 20,
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
    paddingVertical: 64,
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
    maxWidth: 240,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
