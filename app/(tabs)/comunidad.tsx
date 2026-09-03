import AppHeader from '@/components/AppHeader';
import CreatePostModal from '@/components/CreatePostModal';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import {
  CommunityPost,
  getCities,
  getCommunityPosts,
  supabase,
  toggleCommunityPostLike,
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CityOption {
  id: number;
  name: string;
}

export default function ComunidadScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const list = await getCommunityPosts(selectedType, selectedCity?.id, user?.id);
      setPosts(list);
    } catch (err) {
      console.warn('Error loading community posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedCity]);

  const loadCities = useCallback(async () => {
    try {
      const c = await getCities();
      setCities(c);
    } catch {
      // silent
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      loadCities();
    }, [fetchPosts, loadCities])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  async function handleToggleLike(post: CommunityPost) {
    if (!currentUserId) return;

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === post.id) {
          const newLiked = !p.is_liked_by_user;
          const newCount = newLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1);
          return { ...p, is_liked_by_user: newLiked, likes_count: newCount };
        }
        return p;
      })
    );

    try {
      await toggleCommunityPostLike(post.id, currentUserId);
    } catch {
      // Revert if error
      fetchPosts();
    }
  }

  const renderHeaderLeft = (
    <TouchableOpacity
      style={styles.publishHeaderBtn}
      onPress={() => setShowCreateModal(true)}
      activeOpacity={0.8}
    >
      <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
      <Text style={styles.publishHeaderBtnText}>Publicar</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <AppHeader
        title="Comunidad"
        leftElement={renderHeaderLeft}
        showNotif={true}
      />

      {/* Bar de Filtros */}
      <View style={styles.filterSection}>
        {/* Chips de Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'anuncio', label: 'Anuncios' },
            { id: 'evento', label: 'Eventos' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedType === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedType(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedType === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Filtro de Ciudad */}
          <TouchableOpacity
            style={[
              styles.cityFilterChip,
              selectedCity && styles.cityFilterChipActive,
            ]}
            onPress={() => setShowCityModal(true)}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={selectedCity ? Colors.white : Colors.accent}
            />
            <Text
              style={[
                styles.cityFilterChipText,
                selectedCity && styles.cityFilterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedCity ? selectedCity.name : 'Ciudad'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={selectedCity ? Colors.white : Colors.accent}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Feed de Publicaciones */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={[neumorphicStyles.subtitle, { marginTop: 16 }]}>Cargando comunidad…</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.feedScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => {
            const isEvento = item.post_type === 'evento';
            const authorName = item.author?.full_name || `@${item.author?.username || 'emprendedor'}`;
            const initial = authorName[0]?.toUpperCase() ?? '?';

            return (
              <TouchableOpacity
                style={[neumorphicStyles.card, styles.postCard]}
                onPress={() => router.push(`/comunidad/${item.id}` as any)}
                activeOpacity={0.9}
              >
                {/* Header del post */}
                <View style={styles.postHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{authorName}</Text>
                    {item.city?.name && (
                      <Text style={styles.cityName}>📍 {item.city.name}</Text>
                    )}
                  </View>

                  <View style={[styles.typeBadge, isEvento ? styles.badgeEvento : styles.badgeAnuncio]}>
                    <Ionicons
                      name={isEvento ? 'calendar-outline' : 'megaphone-outline'}
                      size={12}
                      color={Colors.white}
                    />
                    <Text style={styles.badgeText}>{isEvento ? 'Evento' : 'Anuncio'}</Text>
                  </View>
                </View>

                {/* Contenido */}
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postContent} numberOfLines={3}>
                  {item.content}
                </Text>

                {/* Imagen adjunta */}
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
                ) : null}

                {/* Acciones e interacción */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleToggleLike(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.is_liked_by_user ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.is_liked_by_user ? Colors.accent : Colors.textSecondary}
                    />
                    <Text style={[styles.actionText, item.is_liked_by_user && { color: Colors.accent }]}>
                      {item.likes_count}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/comunidad/${item.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.actionText}>{item.comments_count}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No hay publicaciones aún</Text>
              <Text style={styles.emptySubtitle}>
                Sé el primero en compartir un anuncio o evento con la comunidad de LIWA.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de selección de Ciudad */}
      <Modal visible={showCityModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityModal(false)}
        >
          <View style={styles.cityModalCard}>
            <Text style={styles.cityModalTitle}>Filtrar por Ciudad</Text>
            <TouchableOpacity
              style={styles.cityOption}
              onPress={() => {
                setSelectedCity(null);
                setShowCityModal(false);
              }}
            >
              <Text
                style={[
                  styles.cityOptionText,
                  !selectedCity && { fontWeight: '700', color: Colors.accent },
                ]}
              >
                Todas las ciudades
              </Text>
            </TouchableOpacity>

            {cities.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.cityOption}
                onPress={() => {
                  setSelectedCity(c);
                  setShowCityModal(false);
                }}
              >
                <Text
                  style={[
                    styles.cityOptionText,
                    selectedCity?.id === c.id && { fontWeight: '700', color: Colors.accent },
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para Crear Publicación */}
      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  publishHeaderBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.shadowDark,
  },
  categoryChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  cityFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  cityFilterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  cityFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    maxWidth: 90,
  },
  cityFilterChipTextActive: {
    color: Colors.white,
  },
  feedScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cityName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeAnuncio: {
    backgroundColor: Colors.accent,
  },
  badgeEvento: {
    backgroundColor: '#7C3AED',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // City modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  cityModalCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  cityModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  cityOption: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.shadowDark,
  },
  cityOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
