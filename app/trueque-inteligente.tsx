import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getBarterProposalById, getMyProducts, getProductById, Product, sendBarterProposal, supabase, updateBarterProposalStatus } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TruequeInteligenteScreen() {
  const { id, proposal_id } = useLocalSearchParams<{ id?: string; proposal_id?: string }>();

  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedOfferProducts, setSelectedOfferProducts] = useState<Product[]>([]);
  const [proposalData, setProposalData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReadOnlyProposal, setIsReadOnlyProposal] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión');
        router.back();
        return;
      }
      setCurrentUserId(user.id);

      if (proposal_id) {
        // Cargar propuesta existente (ej: vista del vendedor desde notificaciones)
        setIsReadOnlyProposal(true);
        const data = await getBarterProposalById(Number(proposal_id));
        setProposalData(data);
        setTargetProduct(data.target_product);

        const offeredProds: Product[] = (data.offered_items ?? [])
          .map((item: any) => item.product)
          .filter(Boolean);

        setSelectedOfferProducts(offeredProds);
      } else if (id) {
        // Crear nueva propuesta (modo comprador)
        setIsReadOnlyProposal(false);
        const product = await getProductById(Number(id));
        setTargetProduct(product);

        const userProducts = await getMyProducts(user.id);
        setMyProducts(userProducts);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/trueque' as any);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [id, handleBack]),
  );

  const toggleSelectProduct = (product: Product) => {
    const exists = selectedOfferProducts.some((p) => p.id === product.id);
    if (exists) {
      setSelectedOfferProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      if (selectedOfferProducts.length >= 4) {
        Alert.alert('Límite alcanzado', 'Puedes seleccionar hasta 4 artículos para tu oferta.');
        return;
      }
      setSelectedOfferProducts((prev) => [...prev, product]);
    }
  };

  const totalOfferValue = selectedOfferProducts.reduce((sum, item) => sum + Number(item.price), 0);
  const targetValue = targetProduct ? Number(targetProduct.price) : 0;
  const difference = targetValue - totalOfferValue;

  async function handleSendProposal() {
    if (selectedOfferProducts.length === 0) {
      Alert.alert('Selecciona al menos 1 producto', 'Debes agregar al menos un producto a tu oferta.');
      return;
    }
    if (!targetProduct || !currentUserId) return;

    setSubmitting(true);
    try {
      await sendBarterProposal({
        sender_user_id: currentUserId,
        receiver_user_id: targetProduct.user_id,
        target_product_id: targetProduct.id,
        offered_product_ids: selectedOfferProducts.map((p) => p.id),
      });

      Alert.alert('¡Oferta Enviada!', 'Tu propuesta de trueque se envió correctamente al vendedor.', [
        { text: 'Aceptar', onPress: () => router.replace('/(tabs)/trueque' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo enviar la propuesta');
    } finally {
      setSubmitting(false);
    }
  }

  const handleAcceptProposal = async () => {
    if (!proposal_id) return;
    setSubmitting(true);
    try {
      await updateBarterProposalStatus(Number(proposal_id), 'accepted');
      Alert.alert('¡Trueque Aceptado!', 'Has aceptado la oferta de trueque.', [
        { text: 'Aceptar', onPress: () => router.replace('/(tabs)/notificaciones' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo aceptar la oferta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!proposal_id) return;
    setSubmitting(true);
    try {
      await updateBarterProposalStatus(Number(proposal_id), 'rejected');
      Alert.alert('Oferta Rechazada', 'Has rechazado la propuesta de trueque.', [
        { text: 'Aceptar', onPress: () => router.replace('/(tabs)/notificaciones' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo rechazar la oferta');
    } finally {
      setSubmitting(false);
    }
  };

  const firstTargetImage = targetProduct?.images?.[0]?.url ?? null;
  const senderName = proposalData?.sender?.full_name ?? 'Comprador';

  if (loading) {
    return (
      <SafeAreaView style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  // ─── Vista 1: Modo Vendedor (Revisar Oferta de Trueque Recibida) ──────────────
  if (isReadOnlyProposal) {
    const diffVal = totalOfferValue - targetValue;
    return (
      <SafeAreaView style={neumorphicStyles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backCircle} onPress={handleBack} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalle del Trueque</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Tu Producto (Tarjeta principal) */}
          <Text style={styles.sellerSectionLabel}>Tu Producto</Text>
          <View style={[neumorphicStyles.card, styles.sellerProductCard]}>
            <View style={styles.sellerImageContainer}>
              {firstTargetImage ? (
                <Image source={{ uri: firstTargetImage }} style={styles.sellerMainImg} resizeMode="cover" />
              ) : (
                <View style={[styles.sellerMainImg, styles.imgPlaceholder]}>
                  <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.sellerProductInfo}>
              <Text style={styles.sellerProductTitle}>{targetProduct?.title}</Text>
              <Text style={styles.sellerProductCondition}>
                Estado: {targetProduct?.condition?.name ?? 'Usado'}
              </Text>
              <View style={styles.sellerPriceRow}>
                <Text style={styles.sellerPriceLabel}>VALOR ESTIMADO</Text>
                <Text style={styles.sellerPriceValue}>
                  ${targetValue.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Ícono de Intercambio Central */}
          <View style={styles.swapDivider}>
            <Ionicons name="swap-vertical" size={26} color={Colors.textSecondary} />
          </View>

          {/* Oferta de [Nombre Emisor] */}
          <Text style={styles.sellerSectionLabel}>
            Oferta de <Text style={{ color: '#8e44ad' }}>{senderName}</Text>
          </Text>

          <View style={styles.offeredList}>
            {selectedOfferProducts.map((prod) => {
              const pImg = prod.images?.[0]?.url;
              return (
                <View key={prod.id} style={[neumorphicStyles.card, styles.offeredCardItem]}>
                  {pImg ? (
                    <Image source={{ uri: pImg }} style={styles.offeredItemImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.offeredItemImg, styles.imgPlaceholder]}>
                      <Ionicons name="cube-outline" size={24} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.offeredItemInfo}>
                    <Text style={styles.offeredItemTitle} numberOfLines={1}>
                      {prod.title}
                    </Text>
                    <Text style={styles.offeredItemCondition}>
                      {prod.condition?.name ?? 'Usado'}
                    </Text>
                    <Text style={styles.offeredItemPrice}>
                      Valor: ${Number(prod.price).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Resumen de Equivalencia (Caja Verde) */}
          <View style={styles.sellerSummaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor de tu Producto</Text>
              <Text style={styles.summaryValue}>${targetValue.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor Total Ofrecido</Text>
              <Text style={[styles.summaryValue, { color: '#27ae60', fontWeight: '800' }]}>
                ${totalOfferValue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diferencia</Text>
              <View style={[styles.diffBadge, { backgroundColor: diffVal >= 0 ? '#d4efdf' : '#fadbd8' }]}>
                <Text style={[styles.diffBadgeText, { color: diffVal >= 0 ? '#27ae60' : '#c0392b' }]}>
                  {diffVal >= 0
                    ? `+ $${diffVal.toFixed(2)} a tu favor`
                    : `- $${Math.abs(diffVal).toFixed(2)} de diferencia`}
                </Text>
              </View>
            </View>
          </View>

          {/* Botones de Acción para el Vendedor */}
          {(() => {
            const stName = proposalData?.barter_state?.name?.toLowerCase() ?? '';
            const isPending = stName.includes('pendient') || proposalData?.state_id === 1 || !proposalData?.state_id;
            const isAccepted = stName.includes('aceptad') || stName.includes('completad') || proposalData?.state_id === 2;

            if (isPending) {
              return (
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={handleAcceptProposal}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="hand-left-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.acceptBtnText}>Aceptar Trueque</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={handleRejectProposal}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            const bannerText = proposalData?.barter_state?.name
              ? `Propuesta: ${proposalData.barter_state.name}`
              : isAccepted
              ? 'Propuesta Aceptada'
              : 'Propuesta Rechazada';

            return (
              <View style={[styles.statusBanner, { backgroundColor: isAccepted ? '#d4efdf' : '#fadbd8' }]}>
                <Text style={[styles.statusBannerText, { color: isAccepted ? '#27ae60' : '#c0392b' }]}>
                  {bannerText}
                </Text>
              </View>
            );
          })()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Vista 2: Modo Comprador (Enviar Oferta de Trueque) ──────────────────────
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={handleBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trueque Inteligente</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Card: LO QUE BUSCAS */}
        <View style={[neumorphicStyles.card, styles.targetCard]}>
          <View style={styles.targetRow}>
            {firstTargetImage ? (
              <Image source={{ uri: firstTargetImage }} style={styles.targetImg} resizeMode="cover" />
            ) : (
              <View style={[styles.targetImg, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.targetInfo}>
              <Text style={styles.loQueBuscasLabel}>LO QUE BUSCAS</Text>
              <Text style={styles.targetTitle} numberOfLines={2}>
                {targetProduct?.title}
              </Text>
            </View>
          </View>

          <View style={styles.targetValueBox}>
            <View>
              <Text style={styles.targetValueLabel}>Valor estimado requerido</Text>
              <Text style={styles.targetValueAmount}>
                ${targetValue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.tagIconCircle}>
              <Ionicons name="pricetag-outline" size={20} color="#27ae60" />
            </View>
          </View>
        </View>

        {/* Card: MI OFERTA */}
        <View style={[neumorphicStyles.card, styles.offerCard]}>
          <Text style={styles.offerSectionTitle}>Mi Oferta</Text>

          {/* Grid 2x2 para seleccionar/mostrar items */}
          <View style={styles.gridContainer}>
            {[0, 1, 2, 3].map((index) => {
              const item = selectedOfferProducts[index];
              if (item) {
                const img = item.images?.[0]?.url;
                return (
                  <View key={index} style={styles.gridSlotFilled}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.slotImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.slotImg, styles.imgPlaceholder]}>
                        <Ionicons name="cube-outline" size={20} color={Colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.slotTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.slotPrice}>
                      ${Number(item.price).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeSlotBtn}
                      onPress={() => toggleSelectProduct(item)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.gridSlotEmpty}
                  activeOpacity={0.8}
                  onPress={() => setModalVisible(true)}
                >
                  <View style={styles.plusCircle}>
                    <Ionicons name="add" size={22} color={Colors.accent} />
                  </View>
                  <Text style={styles.agregarText}>Agregar</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recaudado / Cálculo de equivalencia */}
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Valor total de tu oferta:</Text>
              <Text style={styles.totalAmount}>
                ${totalOfferValue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {difference > 0 ? (
              <View style={styles.warningRow}>
                <Ionicons name="information-circle-outline" size={16} color="#c0392b" />
                <Text style={styles.warningText}>Agrega artículos para igualar el valor</Text>
              </View>
            ) : (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#27ae60" />
                <Text style={styles.successText}>¡Tu oferta iguala o supera el valor requerido!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón Mandar oferta de trueque */}
        <TouchableOpacity
          style={[
            neumorphicStyles.button,
            styles.submitBtn,
            (selectedOfferProducts.length === 0 || submitting) && styles.disabledBtn,
          ]}
          onPress={handleSendProposal}
          disabled={selectedOfferProducts.length === 0 || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.submitBtnRow}>
              <Ionicons name="swap-horizontal" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={neumorphicStyles.buttonText}>Mandar oferta de trueque</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para elegir mis productos */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tus productos</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {myProducts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="alert-circle-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.modalEmptyText}>
                  No tienes productos publicados.{'\n'}Publica un producto para ofrecer trueques.
                </Text>
              </View>
            ) : (
              <FlatList
                data={myProducts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const isSelected = selectedOfferProducts.some((p) => p.id === item.id);
                  const img = item.images?.[0]?.url;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItemRow, isSelected && styles.modalItemRowSelected]}
                      onPress={() => toggleSelectProduct(item)}
                      activeOpacity={0.8}
                    >
                      {img ? (
                        <Image source={{ uri: img }} style={styles.modalItemImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.modalItemImg, styles.imgPlaceholder]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.modalItemPrice}>
                          ${Number(item.price).toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? Colors.accent : Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={[neumorphicStyles.button, { marginTop: 14 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={neumorphicStyles.buttonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  targetCard: {
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 20,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  targetImg: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  imgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  targetInfo: {
    flex: 1,
  },
  loQueBuscasLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  targetTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  targetValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f8f5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  targetValueLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  targetValueAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  tagIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCard: {
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 20,
  },
  offerSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridSlotEmpty: {
    width: '48%',
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gridSlotFilled: {
    width: '48%',
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.shadowDark,
    padding: 6,
    alignItems: 'center',
  },
  slotImg: {
    width: '100%',
    height: 60,
    borderRadius: 10,
  },
  slotTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  slotPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent,
  },
  removeSlotBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  totalBox: {
    backgroundColor: 'rgba(200,0,0,0.1)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningText: {
    color: '#c0392b',
    fontSize: 11,
    fontWeight: '600',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successText: {
    color: '#27ae60',
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
  },
  submitBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderColor: '#000',
    borderLeftWidth: 2,
    borderRightWidth: 2,
   
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  modalEmptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    gap: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  modalItemRowSelected: {
    backgroundColor: 'rgba(142, 68, 173, 0.08)',
  },
  modalItemImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent,
    marginTop: 2,
  },
  // ─── Estilos Vendedor ───────────────────────────────────────────────────────
  sellerSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  sellerProductCard: {
    marginHorizontal: 0,
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sellerImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.background,
  },
  sellerMainImg: {
    width: '100%',
    height: '100%',
  },
  sellerProductInfo: {
    padding: 16,
  },
  sellerProductTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sellerProductCondition: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  sellerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  sellerPriceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  sellerPriceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#d63031',
  },
  swapDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  offeredList: {
    gap: 12,
    marginBottom: 16,
  },
  offeredCardItem: {
    marginHorizontal: 0,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offeredItemImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  offeredItemInfo: {
    flex: 1,
  },
  offeredItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  offeredItemCondition: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  offeredItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#27ae60',
  },
  sellerSummaryBox: {
    backgroundColor: '#e8f8f5',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    marginVertical: 4,
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  diffBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtonsCol: {
    gap: 12,
    marginBottom: 16,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b8a43',
    borderRadius: 16,
    paddingVertical: 16,
  },
  acceptBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  rejectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fceae8',
    borderRadius: 16,
    paddingVertical: 14,
  },
  rejectBtnText: {
    color: '#d63031',
    fontSize: 15,
    fontWeight: '800',
  },
  statusBanner: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
