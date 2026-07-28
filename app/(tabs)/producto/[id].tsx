import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getProductById, ProductDetail } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images }: { images: { url: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  }

  if (images.length === 0) {
    return (
      <View style={styles.imagePlaceholderBox}>
        <Ionicons name="image-outline" size={56} color={Colors.textSecondary} />
        <Text style={styles.noImageText}>Sin imágenes</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.carouselScroll}
      >
        {images.map((img, i) => (
          <Image
            key={i}
            source={{ uri: img.url }}
            style={styles.carouselImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      {/* Image counter badge */}
      {images.length > 1 && (
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Seller Card ──────────────────────────────────────────────────────────────
function SellerCard({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <View style={[neumorphicStyles.card, styles.sellerCard]}>
      <Text style={[neumorphicStyles.label, { marginBottom: 14 }]}>
        Vendedor
      </Text>
      <View style={styles.sellerRow}>
        <View style={styles.sellerAvatar}>
          <Text style={styles.sellerInitials}>{initials}</Text>
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{name ?? 'Usuario Liwa'}</Text>
          {/* <Text style={styles.sellerSub}>Miembro de Liwa</Text> */}
        </View>
        {/* <View style={styles.sellerBadge}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
        </View> */}
      </View>
    </View>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <View style={styles.skeletonImg} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 10 }]} />
        <View style={[styles.skeletonLine, { width: '35%', marginTop: 10 }]} />
      </View>
      <ActivityIndicator
        color={Colors.accent}
        style={{ marginTop: 32 }}
        size="large"
      />
    </SafeAreaView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchProduct() {
    setLoading(true);
    setError(false);
    try {
      const data = await getProductById(Number(id));
      setProduct(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <Skeleton />;

  if (error || !product) {
    return (
      <SafeAreaView style={[neumorphicStyles.screen, styles.centered]}>
        <Ionicons name="wifi-outline" size={48} color={Colors.textSecondary} />
        <Text style={[neumorphicStyles.subtitle, { textAlign: 'center', marginTop: 12 }]}>
          No se pudo cargar el producto.
        </Text>
        <TouchableOpacity
          style={[neumorphicStyles.button, styles.retryBtn]}
          onPress={fetchProduct}
        >
          <Text style={neumorphicStyles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasDescription = product.description && product.description.trim().length > 0;

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button — floating over the carousel */}
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        <ImageCarousel images={product.images} />

        {/* Content */}
        <View style={styles.content}>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {product.category && (
              <View style={styles.badge}>
                <Ionicons name="grid-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.badgeText}>{product.category.name}</Text>
              </View>
            )}
            {product.condition && (
              <View style={[styles.badge, styles.badgeAccent]}>
                <Ionicons name="layers-outline" size={12} color={Colors.white} />
                <Text style={[styles.badgeText, { color: Colors.white }]}>
                  {product.condition.name}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Price */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Precio</Text>
            <Text style={styles.price}>
              Q{product.price.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Description */}
          {hasDescription && (
            <View style={[neumorphicStyles.card, styles.descCard]}>
              <Text style={[neumorphicStyles.label, { marginBottom: 10 }]}>
                Descripción
              </Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Seller */}
          <SellerCard name={product.seller?.full_name ?? null} />

          {/* Contact button */}
          <TouchableOpacity
            style={[neumorphicStyles.button, styles.contactBtn]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={Colors.white}
              style={{ marginRight: 8 }}
            />
            <Text style={neumorphicStyles.buttonText}>Contactar vendedor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CAROUSEL_HEIGHT = 300;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 48,
  },

  // Back button
  backRow: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
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

  // Carousel
  carouselScroll: {
    height: CAROUSEL_HEIGHT,
    backgroundColor: Colors.background,
  },
  carouselImage: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
  },
  imagePlaceholderBox: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -20,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.shadowDark,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.accent,
  },
  counterBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Content area
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeAccent: {
    backgroundColor: Colors.accent,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Title
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },

  // Price
  priceBox: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  priceLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  price: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Description
  descCard: {
    marginHorizontal: 0,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Seller
  sellerCard: {
    marginHorizontal: 0,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  sellerInitials: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sellerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sellerBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Contact button
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Error / retry
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
  },

  // Skeleton
  skeletonImg: {
    width: SCREEN_W,
    height: CAROUSEL_HEIGHT,
    backgroundColor: Colors.shadowDark,
    opacity: 0.3,
  },
  skeletonBody: {
    padding: 20,
    gap: 8,
  },
  skeletonLine: {
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.shadowDark,
    opacity: 0.25,
    width: '80%',
  },
});
