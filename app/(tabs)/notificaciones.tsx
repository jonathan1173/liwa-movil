import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { getNotifications, markNotificationRead, NotificationItem, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificacionesScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchNotifications(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err: any) {
      console.warn('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/inicio' as any);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack]),
  );

  async function handleNotificationPress(item: NotificationItem) {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // silent
      }
    }

    if (item.proposal_id) {
      // Navegar a los detalles de la oferta de trueque enviada
      router.push(`/trueque-inteligente?proposal_id=${item.proposal_id}` as any);
    }
  }

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const senderName = item.sender?.full_name ?? 'Un usuario';
    const senderPhoto = item.sender?.photo_url;
    const targetTitle = item.proposal?.target_product?.title ?? 'tu producto';
    const barterStateName = item.proposal?.barter_state?.name?.toLowerCase() ?? '';
    const isAccepted = barterStateName.includes('aceptad') || barterStateName.includes('completad') || item.proposal?.state_id === 2;
    const isRejected = barterStateName.includes('rechazad') || barterStateName.includes('cancelad') || item.proposal?.state_id === 3;

    let statusIconName: keyof typeof Ionicons.glyphMap = 'swap-horizontal';
    let statusBgColor = 'rgba(214, 48, 49, 0.1)';
    let statusIconColor: string = Colors.accent;
    let statusLabel = item.proposal?.barter_state?.name ?? 'Pendiente';

    if (isAccepted) {
      statusIconName = 'checkmark-circle';
      statusBgColor = 'rgba(39, 174, 96, 0.15)';
      statusIconColor = '#27ae60';
      statusLabel = 'Aceptado';
    } else if (isRejected) {
      statusIconName = 'close-circle';
      statusBgColor = 'rgba(192, 57, 43, 0.15)';
      statusIconColor = '#c0392b';
      statusLabel = 'Rechazado';
    } else {
      statusIconName = 'time-outline';
      statusBgColor = 'rgba(243, 156, 18, 0.15)';
      statusIconColor = '#f39c12';
      statusLabel = 'Pendiente';
    }

    return (
      <TouchableOpacity
        style={[neumorphicStyles.card, styles.notifCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.88}
      >
        {/* Top: Avatar, texto y badge no leído */}
        <View style={styles.topRow}>
          {senderPhoto ? (
            <Image source={{ uri: senderPhoto }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.messageText}>
              <Text style={styles.senderName}>{senderName} </Text>
              te ha ofrecido un trueque por tu "{targetTitle}".
            </Text>
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Bottom Box: Estado del trueque + Botón Revisar oferta */}
        <View style={styles.offerPreviewBox}>
          <View style={styles.miniImagesRow}>
            <View style={[styles.barterIconContainer, { backgroundColor: statusBgColor }]}>
              <Ionicons name={statusIconName} size={20} color={statusIconColor} />
            </View>
            <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '700', color: statusIconColor }}>
              {statusLabel}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.reviewBtnText}>Revisar oferta</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.pageTitle}>Notificaciones</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNotifications(true)}
                tintColor={Colors.accent}
                colors={[Colors.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                <Text style={styles.emptySubtitle}>
                  No tienes notificaciones o propuestas de trueque por el momento.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 40,
    gap: 14,
  },
  notifCard: {
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 20,
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  textContainer: {
    flex: 1,
  },
  senderName: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d63031',
    marginTop: 4,
  },
  offerPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    padding: 8,
    paddingHorizontal: 12,
  },
  miniImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barterIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(214, 48, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b8a43',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reviewBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
  },
});
