import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getBarterProducts, Product } from '@/lib/supabase';
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

// ─── Product Card (Trueque) ───────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0]?.url ?? null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardWrapper}
      onPress={() => router.push(`/producto/${product.id}` as any)}
    >
      <View style={[neumorphicStyles.card, styles.productCard]}>
        {/* Image area */}
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

          <Text style={styles.price}>
            Est. ${product.price.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} USD
          </Text>

          {/* Botón de Trueque */}
          <TouchableOpacity
            style={styles.barterBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/producto/${product.id}` as any)}
          >
            <Ionicons name="swap-horizontal" size={16} color={Colors.white} />
            <Text style={styles.barterBtnText}>Trueque</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TruequeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function fetchProducts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await getBarterProducts();
      setProducts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchProducts();

      const onBackPress = () => {
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
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
        {/* Header / Search bar */}
        <View style={styles.topBar}>
          <View style={styles.headerTitleRow}>
            {/* <Ionicons name="swap-horizontal" size={24} color={Colors.accent} /> */}
            <Text style={styles.greeting}>Trueques</Text>
          </View>
        </View>

        <View style={[neumorphicStyles.inputContainer, styles.searchBar]}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          <Text style={[neumorphicStyles.inputText, { color: Colors.textPlaceholder }]}>
            Buscar productos de trueque…
          </Text>
        </View>

        <Text style={[neumorphicStyles.label, { marginTop: 20, marginBottom: 14 }]}>
          Productos disponibles para trueque
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
            <Ionicons name="swap-horizontal" size={40} color={Colors.textSecondary} />
            <Text style={[neumorphicStyles.subtitle, { textAlign: 'center', marginTop: 8 }]}>
              No hay productos con trueque activo.{'\n'}¡Sé el primero en ofrecer uno!
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
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
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
    gap: 6,
  },
  productTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  price: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  barterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 4,
  },
  barterBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
