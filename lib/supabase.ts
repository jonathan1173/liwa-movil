import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Profile helpers ─────────────────────────────────────────────────────────

export async function checkProfileCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profile')
    .select('profile_completed')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.profile_completed ?? false;
}

export interface ProfileUpdate {
  full_name: string;
  username: string;
  phone: string;
  city_id: number;
  gender_id: number;
  ethnicity_id: number;
  latitude?: number | null;
  longitude?: number | null;
  profile_completed: boolean;
}

export async function updateProfile(userId: string, profile: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profile')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface SellerLocation {
  id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  city?: { name: string } | null;
}

export async function getSellerLocations(): Promise<SellerLocation[]> {
  const { data, error } = await supabase
    .from('profile')
    .select(`
      id,
      full_name,
      username,
      phone,
      latitude,
      longitude,
      city:city_id ( name )
    `)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    console.warn('Error fetching seller locations:', error);
    return [];
  }

  return (data ?? []).map((p: any) => ({
    ...p,
    city: Array.isArray(p.city) ? (p.city[0] ?? null) : (p.city ?? null),
  }));
}

// ─── Catalog helpers ─────────────────────────────────────────────────────────

export async function getCities() {
  const { data, error } = await supabase.from('city').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getGenders() {
  const { data, error } = await supabase.from('gender').select('id, name').order('id');
  if (error) throw error;
  return data ?? [];
}

export async function getEthnicities() {
  const { data, error } = await supabase.from('ethnicity').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getStates() {
  const { data, error } = await supabase.from('state').select('id, name').order('id');
  if (error) throw error;
  return data ?? [];
}

export async function getCategories(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase.from('category').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getConditions(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase.from('product_condition').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

// ─── Product helpers ──────────────────────────────────────────────────────────

export interface ProductState {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  user_id?: string;
  title: string;
  description: string | null;
  price: number;
  barter: boolean;
  state_id?: number | null;
  status?: string;
  created_at: string;
  category: { name: string } | null;
  condition: { name: string } | null;
  state?: { id: number; name: string } | null;
  images: { url: string }[];
}

function formatProductImages(rawImages: any[]): { url: string }[] {
  const urls: string[] = (rawImages ?? [])
    .map((img: any) => img.url)
    .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 4);
  return uniqueUrls.map((url) => ({ url }));
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      user_id,
      title,
      description,
      price,
      barter,
      state_id,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      state:state_id ( id, name ),
      images:product_image ( url )
    `)
    .or('state_id.eq.1,state_id.is.null')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error Supabase getProducts:', error);
    throw error;
  }

  return (data ?? []).map((p: any) => ({
    ...p,
    state: Array.isArray(p.state) ? (p.state[0] ?? null) : (p.state ?? null),
    category: Array.isArray(p.category) ? (p.category[0] ?? null) : (p.category ?? null),
    condition: Array.isArray(p.condition) ? (p.condition[0] ?? null) : (p.condition ?? null),
    status: p.state?.name ?? 'Activo',
    barter: p.barter ?? true,
    images: formatProductImages(p.images),
  }));
}

export async function getBarterProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      user_id,
      title,
      description,
      price,
      barter,
      state_id,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      state:state_id ( id, name ),
      images:product_image ( url )
    `)
    .eq('barter', true)
    .or('state_id.eq.1,state_id.is.null')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error Supabase getBarterProducts:', error);
    throw error;
  }

  return (data ?? []).map((p: any) => ({
    ...p,
    state: Array.isArray(p.state) ? (p.state[0] ?? null) : (p.state ?? null),
    category: Array.isArray(p.category) ? (p.category[0] ?? null) : (p.category ?? null),
    condition: Array.isArray(p.condition) ? (p.condition[0] ?? null) : (p.condition ?? null),
    status: p.state?.name ?? 'Activo',
    barter: true,
    images: formatProductImages(p.images),
  }));
}

/** Devuelve todas las publicaciones del propio usuario */
export async function getMyProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      user_id,
      title,
      description,
      price,
      barter,
      state_id,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      state:state_id ( id, name ),
      images:product_image ( url )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const STATE_NAME_MAP: Record<number, string> = {
    1: 'Activo',
    2: 'Apartado',
    3: 'En espera',
  };

  return (data ?? []).map((p: any) => {
    const stateObj = Array.isArray(p.state) ? (p.state[0] ?? null) : (p.state ?? null);
    const statusName = stateObj?.name ?? (p.state_id ? STATE_NAME_MAP[p.state_id] : null) ?? 'Activo';
    return {
      ...p,
      state: stateObj ?? (p.state_id ? { id: p.state_id, name: statusName } : null),
      category: Array.isArray(p.category) ? (p.category[0] ?? null) : (p.category ?? null),
      condition: Array.isArray(p.condition) ? (p.condition[0] ?? null) : (p.condition ?? null),
      status: statusName,
      barter: p.barter ?? true,
      images: formatProductImages(p.images),
    };
  });
}

// ─── Product Detail ────────────────────────────────────────────────────────────

export interface ProductDetail extends Product {
  user_id: string;
  seller: { full_name: string | null } | null;
}

export async function getProductById(id: number): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      user_id,
      title,
      description,
      price,
      barter,
      state_id,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      state:state_id ( id, name ),
      images:product_image ( url ),
      seller:user_id ( full_name )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const stateObj = Array.isArray((data as any).state)
    ? ((data as any).state[0] ?? null)
    : (data as any).state ?? null;

  return {
    ...data,
    state: stateObj,
    status: stateObj?.name ?? 'Activo',
    barter: (data as any).barter ?? true,
    category: Array.isArray((data as any).category)
      ? ((data as any).category[0] ?? null)
      : (data as any).category ?? null,
    condition: Array.isArray((data as any).condition)
      ? ((data as any).condition[0] ?? null)
      : (data as any).condition ?? null,
    images: formatProductImages((data as any).images),
    seller: (data as any).seller ?? null,
  } as ProductDetail;
}

// ─── Update / Delete product ──────────────────────────────────────────────────

export interface UpdateProductInput {
  title: string;
  description: string;
  price: number;
  barter?: boolean;
  category_id: number | null;
  condition_id: number | null;
  state_id?: number | null;
  status?: string;
}

export async function updateProductDetails(
  id: number,
  input: UpdateProductInput
): Promise<void> {
  const updateData: any = {
    title: input.title,
    description: input.description,
    price: input.price,
    barter: input.barter ?? true,
    category_id: input.category_id,
    condition_id: input.condition_id,
  };
  if (input.state_id !== undefined) {
    updateData.state_id = input.state_id;
  }

  const { error } = await supabase
    .from('product')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(productId: number): Promise<void> {
  const { error } = await supabase
    .from('product')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}

// ─── Create Product & Upload Helpers ──────────────────────────────────────────

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  barter?: boolean;
  category_id: number | null;
  condition_id: number | null;
  state_id?: number | null;
}

export async function createProduct(input: CreateProductInput): Promise<number> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('product')
    .insert({
      user_id: userData.user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      barter: input.barter ?? true,
      category_id: input.category_id,
      condition_id: input.condition_id,
      state_id: input.state_id ?? 1,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function uploadProductImage(
  imageUri: string,
  productId: number,
  index: number
): Promise<string> {
  // 1. Obtener la extensión del archivo
  const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `products/${productId}/${Date.now()}_${index}.${fileExt}`;

  // 2. Convertir la URI local en ArrayBuffer para Expo / React Native
  const response = await fetch(imageUri);
  const blob = await response.arrayBuffer();

  // 3. Subir al bucket "product"
  const { error: uploadError } = await supabase.storage
    .from('product')
    .upload(filePath, blob, {
      contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 4. Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('product')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function addProductImage(
  productId: number,
  url: string
) {
  const { error } = await supabase.from('product_image').insert({
    product_id: productId,
    url,
  });

  if (error) throw error;
}

export async function updateProductImages(
  productId: number,
  imageUris: (string | null)[]
) {
  // 1. Filtrar URIs no nulas y limitar a máximo 4
  const filledImages = (imageUris.filter(Boolean) as string[]).slice(0, 4);

  // 2. Subir imágenes locales que son nuevas y conservar URLs existentes
  const targetUrls: string[] = [];
  for (let i = 0; i < filledImages.length; i++) {
    const uri = filledImages[i];
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      targetUrls.push(uri);
    } else {
      const publicUrl = await uploadProductImage(uri, productId, i);
      targetUrls.push(publicUrl);
    }
  }

  // 3. Consultar los registros actuales en BD para este producto
  const { data: existingRows } = await supabase
    .from('product_image')
    .select('id, url')
    .eq('product_id', productId);

  const currentDbRows = existingRows ?? [];
  const currentDbUrls = currentDbRows.map((r: any) => r.url);

  // 4. Identificar URLs que son verdaderamente nuevas (no están en la BD aún)
  const urlsToInsert = targetUrls.filter((url) => !currentDbUrls.includes(url));

  // 5. Identificar filas existentes en BD que ya no pertenecen al producto
  const rowsToDelete = currentDbRows.filter((r: any) => !targetUrls.includes(r.url));

  // 6. Eliminar las filas obsoletas por su ID primario
  if (rowsToDelete.length > 0) {
    const idsToDelete = rowsToDelete.map((r: any) => r.id);
    await supabase.from('product_image').delete().in('id', idsToDelete);
  }

  // 7. Insertar ÚNICAMENTE las URLs verdaderamente nuevas
  if (urlsToInsert.length > 0) {
    const records = urlsToInsert.map((url) => ({
      product_id: productId,
      url,
    }));

    const { error: insertError } = await supabase
      .from('product_image')
      .insert(records);

    if (insertError) throw insertError;
  }
}

// ─── Favorites helpers ────────────────────────────────────────────────────────


export interface FavoriteProduct {
  id: number;
  favoriteId: number;
  title: string;
  price: number;
  state_id: number | null;
  state: ProductState | null;
  category: { name: string } | null;
  condition: { name: string } | null;
  images: { url: string }[];
}

/** Devuelve todos los productos favoritos del usuario autenticado */
export async function getFavorites(userId: string): Promise<FavoriteProduct[]> {
  const { data, error } = await supabase
    .from('favorite')
    .select(`
      id,
      product:product_id (
        id,
        title,
        price,
        state_id,
        state:state_id ( id, name ),
        category:category_id ( name ),
        condition:condition_id ( name ),
        images:product_image ( url )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .filter((row: any) => row.product != null)
    .map((row: any) => {
      const prod = row.product;
      const stateObj = Array.isArray(prod.state) ? (prod.state[0] ?? null) : (prod.state ?? null);
      return {
        favoriteId: row.id,
        id: prod.id,
        title: prod.title,
        price: prod.price,
        state_id: prod.state_id,
        state: stateObj,
        status: stateObj?.name ?? 'Activo',
        category: Array.isArray(prod.category)
          ? (prod.category[0] ?? null)
          : prod.category ?? null,
        condition: Array.isArray(prod.condition)
          ? (prod.condition[0] ?? null)
          : prod.condition ?? null,
        images: formatProductImages(prod.images),
      };
    });
}

/** Verifica si un producto ya está en favoritos del usuario */
export async function isFavorite(userId: string, productId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorite')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/** Agrega un producto a favoritos */
export async function addFavorite(userId: string, productId: number): Promise<void> {
  const { error } = await supabase
    .from('favorite')
    .insert({ user_id: userId, product_id: productId });

  if (error) throw error;
}

/** Elimina un producto de favoritos */
export async function removeFavorite(userId: string, productId: number): Promise<void> {
  const { error } = await supabase
    .from('favorite')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) throw error;
}

// ─── Barter Proposal & Notifications Helpers ─────────────────────────────────

export interface SendProposalInput {
  sender_user_id: string;
  receiver_user_id: string;
  target_product_id: number;
  offered_product_ids: number[];
}

export async function sendBarterProposal(input: SendProposalInput): Promise<number> {
  // 1. Obtener los estados disponibles en barter_state (con fallback seguro a id 1)
  let pendingStateId = 1;
  try {
    const { data: states } = await supabase
      .from('barter_state')
      .select('id, name')
      .order('id', { ascending: true });

    if (states && states.length > 0) {
      const pendingState = states.find((s) => s.name.toLowerCase().includes('pendient')) ?? states[0];
      pendingStateId = pendingState.id;
    }
  } catch (e) {
    console.warn('Could not fetch barter_state, defaulting to state_id 1:', e);
  }

  // 2. Crear propuesta
  const { data: proposal, error: proposalError } = await supabase
    .from('barter_proposal')
    .insert({
      sender_user_id: input.sender_user_id,
      receiver_user_id: input.receiver_user_id,
      target_product_id: input.target_product_id,
      state_id: pendingStateId,
    })
    .select('id')
    .single();

  if (proposalError) throw proposalError;

  // 3. Insertar items ofrecidos
  const itemsToInsert = input.offered_product_ids.map((prodId) => ({
    barter_proposal_id: proposal.id,
    product_id: prodId,
  }));

  const { error: itemsError } = await supabase
    .from('barter_proposal_item')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // 4. Crear notificación para el receptor del trueque
  const { error: notifError } = await supabase.from('notification').insert({
    user_id: input.receiver_user_id,
    title: 'Nueva propuesta de trueque',
    message: 'Te han enviado una propuesta de intercambio.',
    is_read: false,
  });

  if (notifError) console.warn('Error creating notification:', notifError);

  return proposal.id;
}

export interface NotificationItem {
  id: number;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  proposal_id?: number;
  sender?: { full_name: string | null; photo_url: string | null };
  proposal?: any;
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  // 1. Obtener notificaciones tradicionales
  const { data: notificationsData, error: notifError } = await supabase
    .from('notification')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (notifError) throw notifError;

  // 2. Obtener propuestas de trueque recibidas
  const { data: proposals, error: propError } = await supabase
    .from('barter_proposal')
    .select(`
      id,
      created_at,
      state_id,
      barter_state:state_id ( id, name ),
      sender:sender_user_id ( full_name, photo_url ),
      target_product:target_product_id ( id, title, price, images:product_image ( url ) ),
      offered_items:barter_proposal_item (
        product:product_id ( id, title, price, images:product_image ( url ) )
      )
    `)
    .eq('receiver_user_id', userId)
    .order('created_at', { ascending: false });

  if (propError) console.warn('Error fetching barter proposals:', propError);

  const BARTER_STATE_MAP: Record<number, string> = {
    1: 'Pendiente',
    2: 'Aceptado',
    3: 'Rechazado',
  };

  const items: NotificationItem[] = [];

  // Convertir propuestas recibidas en items de notificación si no están en la tabla notification
  (proposals ?? []).forEach((prop: any) => {
    const senderName = prop.sender?.full_name ?? 'Alguien';
    const targetTitle = prop.target_product?.title ?? 'tu producto';
    const bStateObj = Array.isArray(prop.barter_state) ? (prop.barter_state[0] ?? null) : (prop.barter_state ?? null);
    const bStateName = bStateObj?.name ?? (prop.state_id ? BARTER_STATE_MAP[prop.state_id] : null) ?? 'Pendiente';

    const normalizedProposal = {
      ...prop,
      state_id: prop.state_id,
      barter_state: bStateObj ?? { id: prop.state_id ?? 1, name: bStateName },
    };

    items.push({
      id: prop.id, // ID virtual usando el id de la propuesta
      user_id: userId,
      title: 'Nueva propuesta de trueque',
      message: `${senderName} te ha ofrecido un trueque por tu "${targetTitle}".`,
      is_read: false,
      created_at: prop.created_at,
      proposal_id: prop.id,
      sender: prop.sender,
      proposal: normalizedProposal,
    });
  });

  // Agregar notificaciones generales si no son duplicadas
  (notificationsData ?? []).forEach((n: any) => {
    if (!items.some((item) => item.proposal_id === n.id)) {
      items.push(n);
    }
  });

  // Ordenar por fecha descendente
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items;
}

export async function getBarterProposalById(proposalId: number) {
  const { data, error } = await supabase
    .from('barter_proposal')
    .select(`
      id,
      sender_user_id,
      receiver_user_id,
      target_product_id,
      state_id,
      created_at,
      barter_state:state_id ( id, name ),
      sender:sender_user_id ( full_name, photo_url ),
      target_product:target_product_id ( id, title, price, user_id, images:product_image ( url ) ),
      offered_items:barter_proposal_item (
        product:product_id ( id, title, price, images:product_image ( url ) )
      )
    `)
    .eq('id', proposalId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBarterProposalStatus(proposalId: number, status: 'accepted' | 'rejected') {
  // 1. Asignar el ID de estado directamente (1 = Pendiente, 2 = Aceptado, 3 = Rechazado)
  let targetStateId = status === 'accepted' ? 2 : 3;

  try {
    const { data: states } = await supabase
      .from('barter_state')
      .select('id, name')
      .order('id', { ascending: true });

    if (states && states.length > 0) {
      if (status === 'accepted') {
        const found = states.find((s) =>
          s.id === 2 || s.name.toLowerCase().includes('aceptad') || s.name.toLowerCase().includes('aceptar')
        );
        if (found) targetStateId = found.id;
      } else {
        const found = states.find((s) =>
          s.id === 3 || s.name.toLowerCase().includes('rechazad') || s.name.toLowerCase().includes('cancelad')
        );
        if (found) targetStateId = found.id;
      }
    }
  } catch (e) {
    console.warn('Could not fetch barter_state, using default targetStateId:', e);
  }

  // 2. Actualizar el state_id de la propuesta
  const { data: updatedProposal, error } = await supabase
    .from('barter_proposal')
    .update({ state_id: targetStateId })
    .eq('id', proposalId)
    .select('target_product_id')
    .single();

  if (error) throw error;

  // 3. Si fue aceptado, cambiar el state_id de la publicación del producto destino a 2 (Apartado)
  if (status === 'accepted' && updatedProposal?.target_product_id) {
    const { error: prodErr } = await supabase
      .from('product')
      .update({ state_id: 2 })
      .eq('id', updatedProposal.target_product_id);

    if (prodErr) console.warn('Error updating target product state_id to 2:', prodErr);
  }
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  const { error } = await supabase
    .from('notification')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

// ─── Community Helpers ────────────────────────────────────────────────────────

export interface CommunityPost {
  id: number;
  user_id: string;
  title: string;
  content: string;
  post_type: 'anuncio' | 'evento';
  image_url: string | null;
  city_id: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: { full_name: string | null; username: string | null } | null;
  city?: { name: string } | null;
  is_liked_by_user?: boolean;
}

export interface CommunityComment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null; username: string | null } | null;
}

export async function uploadCommunityImage(imageUri: string): Promise<string> {
  const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const response = await fetch(imageUri);
  const blob = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('community')
    .upload(filePath, blob, {
      contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('community')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export interface CreateCommunityPostInput {
  title: string;
  content: string;
  post_type: 'anuncio' | 'evento';
  image_url?: string | null;
  city_id?: number | null;
}

export async function createCommunityPost(input: CreateCommunityPostInput): Promise<number> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('community_post')
    .insert({
      user_id: userData.user.id,
      title: input.title,
      content: input.content,
      post_type: input.post_type,
      image_url: input.image_url ?? null,
      city_id: input.city_id ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getCommunityPosts(
  postTypeFilter?: string,
  cityIdFilter?: number | null,
  currentUserId?: string
): Promise<CommunityPost[]> {
  let query = supabase
    .from('community_post')
    .select(`
      id,
      user_id,
      title,
      content,
      post_type,
      image_url,
      city_id,
      likes_count,
      comments_count,
      created_at,
      author:user_id ( full_name, username ),
      city:city_id ( name )
    `)
    .order('created_at', { ascending: false });

  if (postTypeFilter && postTypeFilter !== 'todos') {
    query = query.eq('post_type', postTypeFilter);
  }

  if (cityIdFilter) {
    query = query.eq('city_id', cityIdFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }

  let userLikesSet = new Set<number>();
  if (currentUserId && (data ?? []).length > 0) {
    const postIds = data.map((p: any) => p.id);
    const { data: likesData } = await supabase
      .from('community_post_like')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds);

    if (likesData) {
      userLikesSet = new Set(likesData.map((l: any) => l.post_id));
    }
  }

  return (data ?? []).map((p: any) => ({
    ...p,
    author: Array.isArray(p.author) ? (p.author[0] ?? null) : (p.author ?? null),
    city: Array.isArray(p.city) ? (p.city[0] ?? null) : (p.city ?? null),
    likes_count: p.likes_count ?? 0,
    comments_count: p.comments_count ?? 0,
    is_liked_by_user: userLikesSet.has(p.id),
  }));
}

export async function toggleCommunityPostLike(postId: number, userId: string): Promise<boolean> {
  const { data: existingLike } = await supabase
    .from('community_post_like')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingLike) {
    await supabase
      .from('community_post_like')
      .delete()
      .eq('id', existingLike.id);

    const { data: currentPost } = await supabase
      .from('community_post')
      .select('likes_count')
      .eq('id', postId)
      .single();

    const newCount = Math.max(0, (currentPost?.likes_count ?? 1) - 1);
    await supabase.from('community_post').update({ likes_count: newCount }).eq('id', postId);
    return false;
  } else {
    await supabase.from('community_post_like').insert({
      post_id: postId,
      user_id: userId,
    });

    const { data: currentPost } = await supabase
      .from('community_post')
      .select('likes_count')
      .eq('id', postId)
      .single();

    const newCount = (currentPost?.likes_count ?? 0) + 1;
    await supabase.from('community_post').update({ likes_count: newCount }).eq('id', postId);
    return true;
  }
}

export async function getCommunityPostById(postId: number, currentUserId?: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from('community_post')
    .select(`
      id,
      user_id,
      title,
      content,
      post_type,
      image_url,
      city_id,
      likes_count,
      comments_count,
      created_at,
      author:user_id ( full_name, username ),
      city:city_id ( name )
    `)
    .eq('id', postId)
    .single();

  if (error || !data) return null;

  let isLiked = false;
  if (currentUserId) {
    const { data: likeData } = await supabase
      .from('community_post_like')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    isLiked = Boolean(likeData);
  }

  return {
    ...data,
    author: Array.isArray((data as any).author) ? ((data as any).author[0] ?? null) : ((data as any).author ?? null),
    city: Array.isArray((data as any).city) ? ((data as any).city[0] ?? null) : ((data as any).city ?? null),
    is_liked_by_user: isLiked,
  };
}

export async function getCommunityComments(postId: number): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('community_comment')
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      author:user_id ( full_name, username )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c: any) => ({
    ...c,
    author: Array.isArray(c.author) ? (c.author[0] ?? null) : (c.author ?? null),
  }));
}

export async function addCommunityComment(postId: number, content: string, userId: string): Promise<void> {
  const { error } = await supabase.from('community_comment').insert({
    post_id: postId,
    user_id: userId,
    content: content.trim(),
  });

  if (error) throw error;

  const { data: currentPost } = await supabase
    .from('community_post')
    .select('comments_count')
    .eq('id', postId)
    .single();

  const newCount = (currentPost?.comments_count ?? 0) + 1;
  await supabase.from('community_post').update({ comments_count: newCount }).eq('id', postId);
}