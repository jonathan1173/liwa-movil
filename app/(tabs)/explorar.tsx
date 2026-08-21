import AppHeader from '@/components/AppHeader';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getProducts, Product } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0]?.url ?? null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardWrapper}
      onPress={() => router.push(`/producto/${product.id}` as any)}
    >
      <View style={[neumorphicStyles.card, styles.productCard]}>
        <View style={styles.imageBox}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={Colors.textSecondary} />
            </View>
          )}
        </View>

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
            {/* {product.condition && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.condition.name}</Text>
              </View>
            )} */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExplorarScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    } catch (err: any) {
      console.warn('Error fetching products:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  // Filtrado de productos en tiempo real según la búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      const catMatch = p.category?.name.toLowerCase().includes(query);
      return titleMatch || descMatch || catMatch;
    });
  }, [products, searchQuery]);

  const rows: Product[][] = [];
  for (let i = 0; i < filteredProducts.length; i += 2) {
    rows.push(filteredProducts.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={[neumorphicStyles.screen, styles.screenBg]}>
      <AppHeader title="Explorar" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProducts(true)}
            tintColor={Colors.magenta}
            colors={[Colors.magenta]}
          />
        }
      >
        {/* Barra de Búsqueda Funcional */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.magenta} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos y servicios…"
            placeholderTextColor={Colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Encabezado de la lista */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos y Servicios</Text>
          <Text style={styles.resultCount}>{filteredProducts.length} disponibles</Text>
        </View>

        {/* Estado de Carga */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.magenta} />
          </View>
        )}

        {/* Estado de Error */}
        {!loading && error && (
          <View style={styles.feedbackCard}>
            <Ionicons name="wifi-outline" size={40} color={Colors.magenta} />
            <Text style={styles.feedbackText}>
              No se pudo cargar.{'\n'}Desliza hacia abajo para reintentar.
            </Text>
          </View>
        )}

        {/* Estado Vacío */}
        {!loading && !error && filteredProducts.length === 0 && (
          <View style={styles.feedbackCard}>
            <Ionicons name="search-outline" size={44} color={Colors.purple} />
            <Text style={styles.feedbackText}>
              {searchQuery.trim()
                ? `No se encontraron resultados para "${searchQuery}"`
                : 'Aún no hay productos disponibles.'}
            </Text>
          </View>
        )}

        {/* Grid de Productos de 2 Columnas */}
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

const CARD_IMAGE_HEIGHT = 135;

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: Colors.darkGray,
    fontSize: 15,
    marginLeft: 10,
  },
  clearBtn: {
    padding: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.purple,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.green,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  feedbackCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FBFBFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  feedbackText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  col: {
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
  },
  productCard: {
    backgroundColor: Colors.white,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  imageBox: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#F9F9F9',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  productTitle: {
    color: Colors.darkGray,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  category: {
    color: Colors.purple,
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  price: {
    color: Colors.magenta,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: '#EAF5D8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.green,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
