import AppHeader from '@/components/AppHeader';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import {
  addCommunityComment,
  CommunityComment,
  CommunityPost,
  getCommunityComments,
  getCommunityPostById,
  supabase,
  toggleCommunityPostLike,
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CommunityPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        if (postId) {
          const postData = await getCommunityPostById(postId, user?.id);
          setPost(postData);
          const commentsData = await getCommunityComments(postId);
          setComments(commentsData);
        }
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar la publicación.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [postId]);

  async function handleToggleLike() {
    if (!post || !currentUserId) return;

    const originalPost = { ...post };
    const newLiked = !post.is_liked_by_user;
    const newCount = newLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);

    setPost({
      ...post,
      is_liked_by_user: newLiked,
      likes_count: newCount,
    });

    try {
      await toggleCommunityPostLike(post.id, currentUserId);
    } catch {
      setPost(originalPost);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !post || !currentUserId) return;

    setSubmittingComment(true);
    try {
      await addCommunityComment(post.id, newComment, currentUserId);
      setNewComment('');

      // Reload comments and post comment count
      const updatedComments = await getCommunityComments(post.id);
      setComments(updatedComments);
      setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo publicar el comentario.');
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={[neumorphicStyles.subtitle, { marginTop: 16 }]}>Cargando publicación…</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={neumorphicStyles.screen}>
        <AppHeader title="Detalle" showBack />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>La publicación no existe o fue eliminada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEvento = post.post_type === 'evento';
  const authorName = post.author?.full_name || `@${post.author?.username || 'emprendedor'}`;
  const initial = authorName[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <AppHeader title={isEvento ? 'Evento' : 'Anuncio'} showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={[neumorphicStyles.card, styles.postCard]}>
              {/* Autor e info */}
              <View style={styles.authorRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.authorName}>{authorName}</Text>
                  {post.city?.name && (
                    <Text style={styles.cityName}>📍 {post.city.name}</Text>
                  )}
                </View>
                <View style={[styles.badge, isEvento ? styles.badgeEvento : styles.badgeAnuncio]}>
                  <Ionicons
                    name={isEvento ? 'calendar-outline' : 'megaphone-outline'}
                    size={12}
                    color={Colors.white}
                  />
                  <Text style={styles.badgeText}>{isEvento ? 'Evento' : 'Anuncio'}</Text>
                </View>
              </View>

              {/* Título & Contenido */}
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Imagen si existe */}
              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              ) : null}

              {/* Acciones (Likes / Comentarios) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleToggleLike}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={post.is_liked_by_user ? 'heart' : 'heart-outline'}
                    size={22}
                    color={post.is_liked_by_user ? Colors.accent : Colors.textSecondary}
                  />
                  <Text style={[styles.actionText, post.is_liked_by_user && { color: Colors.accent }]}>
                    {post.likes_count}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>{post.comments_count}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Comentarios ({comments.length})</Text>
            </View>
          }
          renderItem={({ item }) => {
            const commentAuthor = item.author?.full_name || `@${item.author?.username || 'usuario'}`;
            const cInitial = commentAuthor[0]?.toUpperCase() ?? '?';
            return (
              <View style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{cInitial}</Text>
                </View>
                <View style={styles.commentContentBox}>
                  <Text style={styles.commentAuthor}>{commentAuthor}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noCommentsText}>Aún no hay comentarios. ¡Sé el primero en responder!</Text>
          }
        />

        {/* Bar de Input de Comentario */}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe un comentario..."
            placeholderTextColor={Colors.textPlaceholder}
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newComment.trim() || submittingComment) && styles.sendBtnDisabled]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  postCard: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cityName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeAnuncio: {
    backgroundColor: Colors.accent,
  },
  badgeEvento: {
    backgroundColor: '#7C3AED',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 14,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.shadowDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noCommentsText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 24,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  commentInput: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.background,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
