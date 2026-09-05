import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import {
  addFavorite,
  deleteProduct,
  getProductById,
  isFavorite,
  ProductDetail,
  removeFavorite,
  supabase,
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MorphIcon } from 'morphicons/react-native';
import { Heart, ArrowLeft } from 'lucide';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
function SellerCard({ name, phone }: { name: string | null; phone?: string | null }) {
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
      <Text style={[neumorphicStyles.label, { marginBottom: 12, color: Colors.purple }]}>
        Información del Vendedor
      </Text>
      <View style={styles.sellerRow}>
        <View style={styles.sellerAvatar}>
          <Text style={styles.sellerInitials}>{initials}</Text>
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{name ?? 'Usuario Liwa'}</Text>
          <View style={styles.sellerVerifiedRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
            <Text style={styles.sellerSub}>
              {phone ? 'WhatsApp disponible' : 'Vendedor Liwa'}
            </Text>
          </View>
        </View>
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Favorite state
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  async function checkFavorite(uid: string) {
    try {
      const result = await isFavorite(uid, Number(id));
      setFavorited(result);
    } catch {
      // silent
    }
  }

  async function toggleFavorite() {
    if (!currentUserId || favLoading) return;
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite(currentUserId, Number(id));
        setFavorited(false);
      } else {
        await addFavorite(currentUserId, Number(id));
        setFavorited(true);
      }
    } catch {
      // silent — state reverts
    } finally {
      setFavLoading(false);
    }
  }

  useEffect(() => {
    // Get current user and check favorite status
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        checkFavorite(user.id);
      }
    });
  }, [id]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inicio' as any);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchProduct();
      }

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [id, handleBack]),
  );

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
  const isOwner = currentUserId !== null && product.user_id === currentUserId;

  async function handleDelete() {
    Alert.alert(
      'Eliminar publicación',
      '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(Number(id));
              router.replace('/(tabs)/inicio' as any);
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'No se pudo eliminar la publicación.');
            }
          },
        },
      ]
    );
  }

  const handleContactSeller = () => {
    const phone = product?.seller?.phone;
    if (!phone || !phone.trim()) {
      Alert.alert(
        'Teléfono no disponible',
        'El vendedor aún no ha registrado su número de teléfono en su perfil.'
      );
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const phoneWithCode = cleanDigits.length === 8 ? `505${cleanDigits}` : cleanDigits;
    const msg = `¡Hola! Vi tu producto "${product.title}" en Liwa y me interesa obtener más información.`;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Linking.openURL(`https://wa.me/${phoneWithCode}`);
        }
      })
      .catch(() => {
        Linking.openURL(whatsappUrl);
      });
  };

  return (
    <SafeAreaView style={styles.screenPurple}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.purple} />

      {/* ── Header Morado Liwa ──────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <MorphIcon icon={ArrowLeft} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle del producto
        </Text>

        <TouchableOpacity
          style={[styles.headerBtn, favorited && styles.headerBtnFavorited]}
          onPress={toggleFavorite}
          activeOpacity={0.85}
          disabled={favLoading}
        >
          <MorphIcon
            icon={Heart}
            size={20}
            color={favorited ? Colors.magenta : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <ImageCarousel images={product.images} />

        {/* Content */}
        <View style={styles.content}>

          {/* Badges con Paleta de Colores Liwa */}
          <View style={styles.badgesRow}>
            {product.category && (
              <View style={styles.categoryBadge}>
                <Ionicons name="grid-outline" size={13} color={Colors.purple} />
                <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
              </View>
            )}
            {product.condition && (
              <View style={styles.conditionBadge}>
                <Ionicons name="sparkles-outline" size={13} color="#4D7C0F" />
                <Text style={styles.conditionBadgeText}>
                  {product.condition.name}
                </Text>
              </View>
            )}
            {product.barter && (
              <View style={styles.barterBadge}>
                <Ionicons name="swap-horizontal" size={13} color={Colors.magenta} />
                <Text style={styles.barterBadgeText}>Acepta Trueque</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Price Box con Acento Magenta */}
          <View style={styles.priceBox}>
            <View style={styles.priceHeaderRow}>
              <Text style={styles.priceLabel}>PRECIO</Text>
              {product.status && (
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{product.status}</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>
              C$ {product.price.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Description */}
          {hasDescription && (
            <View style={[neumorphicStyles.card, styles.descCard]}>
              <Text style={[neumorphicStyles.label, { marginBottom: 10, color: Colors.purple }]}>
                Descripción
              </Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Seller — solo visible para otros usuarios */}
          {!isOwner && (
            <SellerCard
              name={product.seller?.full_name ?? null}
              phone={product.seller?.phone ?? null}
            />
          )}

          {/* Acciones: Editar/Eliminar (dueño) o Contactar vendedor (otros) */}
          {isOwner ? (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[neumorphicStyles.button, styles.editBtn]}
                activeOpacity={0.85}
                onPress={() => router.push(`/producto/editar/${id}` as any)}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={Colors.white}
                  style={{ marginRight: 8 }}
                />
                <Text style={neumorphicStyles.buttonText}>Editar publicación</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteBtn]}
                activeOpacity={0.85}
                onPress={handleDelete}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#e05c5c"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.deleteBtnText}>Eliminar publicación</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buyerActions}>
              {product?.barter && (
                <TouchableOpacity
                  style={[styles.barterBtn]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/trueque-inteligente?id=${id}` as any)}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={20}
                    color={Colors.white}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>Ofrecer Trueque</Text>
                </TouchableOpacity>
              )}

              {/* Botón de Contactar al vendedor por WhatsApp */}
              <TouchableOpacity
                style={styles.whatsappBtn}
                activeOpacity={0.85}
                onPress={handleContactSeller}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={22}
                  color="#FFFFFF"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.whatsappBtnText}>
                  Contactar al vendedor por WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

  screenPurple: {
    flex: 1,
    backgroundColor: '#FAF9FC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.purple,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnFavorited: {
    backgroundColor: 'rgba(236, 0, 108, 0.25)',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginHorizontal: 8,
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

  // Badges con paleta Liwa
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 25, 140, 0.15)',
  },
  categoryBadgeText: {
    color: Colors.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(122, 175, 0, 0.25)',
  },
  conditionBadgeText: {
    color: '#3F6212',
    fontSize: 12,
    fontWeight: '700',
  },
  barterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 0, 108, 0.2)',
  },
  barterBadgeText: {
    color: Colors.magenta,
    fontSize: 12,
    fontWeight: '700',
  },

  // Title
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },

  // Price Box
  priceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: Colors.magenta,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    color: Colors.magenta,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
  sellerVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sellerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  // Buyer actions (barter + WhatsApp)
  buyerActions: {
    gap: 12,
    marginTop: 6,
  },
  barterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Owner actions (edit + delete)
  ownerActions: {
    gap: 12,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e05c5c',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  deleteBtnText: {
    color: '#e05c5c',
    fontSize: 15,
    fontWeight: '700',
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
