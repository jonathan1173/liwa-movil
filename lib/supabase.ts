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
<<<<<<< HEAD
        state_id,
        state:state_id ( id, name ),
=======
>>>>>>> product
        category:category_id ( name ),
        condition:condition_id ( name ),
        images:product_image ( url )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    favoriteId: row.id,
    id: row.product.id,
    title: row.product.title,
    price: row.product.price,
    state_id: row.product.state_id,
    state: Array.isArray(row.product.state)
      ? (row.product.state[0] ?? null)
      : row.product.state ?? null,
    status: row.product.state?.name ?? 'Activo',
    category: Array.isArray(row.product.category)
      ? (row.product.category[0] ?? null)
      : row.product.category ?? null,
    condition: Array.isArray(row.product.condition)
      ? (row.product.condition[0] ?? null)
      : row.product.condition ?? null,
    images: (row.product.images ?? []).sort(
      (a: any, b: any) => a.display_order - b.display_order,
    ),
  }));
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

  const items: NotificationItem[] = [];

  // Convertir propuestas recibidas en items de notificación si no están en la tabla notification
  (proposals ?? []).forEach((prop: any) => {
    const senderName = prop.sender?.full_name ?? 'Alguien';
    const targetTitle = prop.target_product?.title ?? 'tu producto';
    items.push({
      id: prop.id, // ID virtual usando el id de la propuesta
      user_id: userId,
      title: 'Nueva propuesta de trueque',
      message: `${senderName} te ha ofrecido un trueque por tu "${targetTitle}".`,
      is_read: false,
      created_at: prop.created_at,
      proposal_id: prop.id,
      sender: prop.sender,
      proposal: prop,
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
  // 1. Obtener todos los barter_state para encontrar el ID del estado según el nombre
  let targetStateId = status === 'accepted' ? 2 : 3;

  try {
    const { data: states } = await supabase
      .from('barter_state')
      .select('id, name')
      .order('id', { ascending: true });

    if (states && states.length > 0) {
      if (status === 'accepted') {
        const found = states.find((s) =>
          s.name.toLowerCase().includes('aceptad') || s.name.toLowerCase().includes('aceptar') || s.name.toLowerCase().includes('completad')
        );
        if (found) targetStateId = found.id;
      } else {
        const found = states.find((s) =>
          s.name.toLowerCase().includes('rechazad') || s.name.toLowerCase().includes('cancelad')
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

  // 3. Si fue aceptado, cambiar el state_id de la publicación del producto destino a 2
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