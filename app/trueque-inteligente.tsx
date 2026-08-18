import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getBarterProposalById, getMyProducts, getProductById, Product, sendBarterProposal, supabase } from '@/lib/supabase';
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
        const proposalData = await getBarterProposalById(Number(proposal_id));
        setTargetProduct(proposalData.target_product);

        const offeredProds: Product[] = (proposalData.offered_items ?? [])
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

  if (loading) {
    return (
      <SafeAreaView style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  const firstTargetImage = targetProduct?.images?.[0]?.url ?? null;

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
          <Text style={styles.offerSectionTitle}>
            {isReadOnlyProposal ? 'Oferta Recibida' : 'Mi Oferta'}
          </Text>

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
                    {!isReadOnlyProposal && (
                      <TouchableOpacity
                        style={styles.removeSlotBtn}
                        onPress={() => toggleSelectProduct(item)}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              if (isReadOnlyProposal) {
                return (
                  <View key={index} style={[styles.gridSlotEmpty, { opacity: 0.4 }]}>
                    <Text style={styles.agregarText}>Sin artículo</Text>
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
              <Text style={styles.totalLabel}>
                {isReadOnlyProposal ? 'Valor total ofrecido:' : 'Valor total de tu oferta:'}
              </Text>
              <Text style={styles.totalAmount}>
                ${totalOfferValue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {difference > 0 ? (
              <View style={styles.warningRow}>
                <Ionicons name="information-circle-outline" size={16} color="#c0392b" />
                <Text style={styles.warningText}>
                  {isReadOnlyProposal
                    ? `Faltan $${difference.toFixed(2)} para igualar el valor de tu producto`
                    : `Agrega artículos para igualar el valor`}
                </Text>
              </View>
            ) : (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#27ae60" />
                <Text style={styles.successText}>
                  {isReadOnlyProposal
                    ? 'La oferta iguala o supera el valor de tu producto'
                    : '¡Tu oferta iguala o supera el valor requerido!'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón Mandar oferta de trueque (Oculto en modo lectura) */}
        {!isReadOnlyProposal && (
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
        )}
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
});
