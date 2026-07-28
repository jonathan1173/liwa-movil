import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getProducts, Product } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0]?.url ?? null;

  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.cardWrapper}>
      <View style={[neumorphicStyles.card, styles.productCard]}>

        {/* Image area — always rendered, empty if no image */}
        <View style={styles.imageBox}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
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
              C$ {product.price.toLocaleString('es-GT', {
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InicioScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function fetchProducts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Refetch every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  // Pair products into rows of 2
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

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
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Bienvenido</Text>
            <Text style={[neumorphicStyles.subtitle, { marginTop: 2 }]}>
              Bienvenido a Liwa
            </Text>
          </View>

          {/* Botón Publicar en lugar de la 'L' */}
          <TouchableOpacity
            style={[neumorphicStyles.button, styles.publishNavBtn]}
            onPress={() => router.push('/publicar')} // O la ruta correspondiente a tu pantalla
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.publishNavBtnText}>Publicar</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[neumorphicStyles.inputContainer, styles.searchBar]}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          <Text style={[neumorphicStyles.inputText, { color: Colors.textPlaceholder }]}>
            Buscar productos…
          </Text>
        </View>

        {/* Productos recientes */}
        <Text style={[neumorphicStyles.label, { marginTop: 28, marginBottom: 14 }]}>
          Productos recientes
        </Text>

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={[neumorphicStyles.card, styles.feedbackCard]}>
            <Ionicons name="wifi-outline" size={36} color={Colors.textSecondary} />
            <Text style={[neumorphicStyles.subtitle, { textAlign: 'center', marginTop: 8 }]}>
              No se pudo cargar.{'\n'}Desliza hacia abajo para reintentar.
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <View style={[neumorphicStyles.card, styles.feedbackCard]}>
            <Ionicons name="cube-outline" size={40} color={Colors.textSecondary} />
            <Text style={[neumorphicStyles.subtitle, { textAlign: 'center', marginTop: 8 }]}>
              Aún no hay productos.{'\n'}¡Sé el primero en publicar!
            </Text>
          </View>
        )}

        {/* Product grid — 2 columns */}
        {!loading && !error && rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((product) => (
              <View key={product.id} style={styles.col}>
                <ProductCard product={product} />
              </View>
            ))}
            {/* If odd product, fill second column with empty space */}
            {row.length === 1 && <View style={styles.col} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_IMAGE_HEIGHT = 130;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  searchBar: {
    marginBottom: 4,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  feedbackCard: {
    alignItems: 'center',
    paddingVertical: 36,
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
  // Product card
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 4,
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
  publishNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  publishNavBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
