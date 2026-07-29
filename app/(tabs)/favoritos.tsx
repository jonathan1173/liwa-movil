import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getFavorites, removeFavorite, FavoriteProduct } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Favorite Card ─────────────────────────────────────────────────────────────

function FavoriteCard({
  product,
  onRemove,
}: {
  product: FavoriteProduct;
  onRemove: () => void;
}) {
  const firstImage = product.images[0]?.url ?? null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardWrapper}
      onPress={() => router.push(`/(tabs)/producto/${product.id}` as any)}
    >
      <View style={[neumorphicStyles.card, styles.productCard]}>
        {/* Image */}
        <View style={styles.imageBox}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={Colors.textSecondary} />
            </View>
          )}

          {/* Remove button — floating over image */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={18} color="#e05c5c" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          {product.category && (
            <Text style={styles.category} numberOfLines={1}>
              {product.category.name}
            </Text>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              C${' '}
              {product.price.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            {product.condition && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.condition.name}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyFavorites() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="heart-outline" size={40} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
      <Text style={styles.emptySubtitle}>
        Cuando guardes un producto aparecerá aquí
      </Text>
      <TouchableOpacity
        style={[neumorphicStyles.button, styles.browseBtn]}
        onPress={() => router.replace('/(tabs)/inicio' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="grid-outline" size={16} color={Colors.white} style={{ marginRight: 8 }} />
        <Text style={neumorphicStyles.buttonText}>Explorar productos</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  async function fetchFavorites(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const data = await getFavorites(user.id);
      setFavorites(data);
    } catch {
      // silent — will show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Re-fetch each time the screen gets focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  async function handleRemove(product: FavoriteProduct) {
    Alert.alert(
      'Quitar de favoritos',
      `¿Eliminar "${product.title}" de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            try {
              await removeFavorite(userId, product.id);
              setFavorites((prev) => prev.filter((f) => f.id !== product.id));
            } catch {
              Alert.alert('Error', 'No se pudo quitar el favorito. Intenta de nuevo.');
            }
          },
        },
      ],
    );
  }

  // Build grid rows of 2
  const rows: FavoriteProduct[][] = [];
  for (let i = 0; i < favorites.length; i += 2) {
    rows.push(favorites.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFavorites(true)}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[neumorphicStyles.title, styles.pageTitle]}>Favoritos</Text>
        </View>

        {/* Counter */}
        {!loading && favorites.length > 0 && (
          <Text style={styles.counter}>
            {favorites.length} {favorites.length === 1 ? 'producto guardado' : 'productos guardados'}
          </Text>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}

        {/* Empty */}
        {!loading && favorites.length === 0 && <EmptyFavorites />}

        {/* Grid */}
        {!loading &&
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((product) => (
                <View key={product.id} style={styles.col}>
                  <FavoriteCard product={product} onRemove={() => handleRemove(product)} />
                </View>
              ))}
              {row.length === 1 && <View style={styles.col} />}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_IMAGE_HEIGHT = 130;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
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
  counter: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 4,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  // Grid
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  // Card
  cardWrapper: {
    flex: 1,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 18,
  },
  imageBox: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    width: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  productTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  category: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  price: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
    maxWidth: 220,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
