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
  title: string;
  description: string | null;
  price: number;
  state_id: number | null;
  state: ProductState | null;
  created_at: string;
  category: { name: string } | null;
  condition: { name: string } | null;
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
      title,
      description,
      price,
      state_id,
      created_at,
      state:state_id ( id, name ),
      category:category_id ( name ),
      condition:condition_id ( name ),
      images:product_image ( url )
    `)
    .eq('state_id', 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    state: Array.isArray(p.state) ? (p.state[0] ?? null) : (p.state ?? null),
    category: Array.isArray(p.category) ? (p.category[0] ?? null) : (p.category ?? null),
    condition: Array.isArray(p.condition) ? (p.condition[0] ?? null) : (p.condition ?? null),
    images: formatProductImages(p.images),
  }));
}

/** Devuelve todas las publicaciones del propio usuario (todos los estados) */
export async function getMyProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      price,
      state_id,
      created_at,
      state:state_id ( id, name ),
      category:category_id ( name ),
      condition:condition_id ( name ),
      images:product_image ( url )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    state: Array.isArray(p.state) ? (p.state[0] ?? null) : (p.state ?? null),
    category: Array.isArray(p.category) ? (p.category[0] ?? null) : (p.category ?? null),
    condition: Array.isArray(p.condition) ? (p.condition[0] ?? null) : (p.condition ?? null),
    images: formatProductImages(p.images),
  }));
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
      state_id,
      created_at,
      state:state_id ( id, name ),
      category:category_id ( name ),
      condition:condition_id ( name ),
      images:product_image ( url ),
      seller:user_id ( full_name )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    state: Array.isArray((data as any).state)
      ? ((data as any).state[0] ?? null)
      : (data as any).state ?? null,
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
  category_id: number | null;
  condition_id: number | null;
  state_id: number | null;
}

export async function updateProductDetails(
  id: number,
  input: UpdateProductInput
): Promise<void> {
  const { error } = await supabase
    .from('product')
    .update({
      title: input.title,
      description: input.description,
      price: input.price,
      category_id: input.category_id,
      condition_id: input.condition_id,
      state_id: input.state_id,
    })
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


// Publicaciones de productos

// ─── Create Product & Upload Helpers ──────────────────────────────────────────

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
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

  return (data ?? []).map((row: any) => ({
    favoriteId: row.id,
    id: row.product.id,
    title: row.product.title,
    price: row.product.price,
    state_id: row.product.state_id,
    state: Array.isArray(row.product.state)
      ? (row.product.state[0] ?? null)
      : row.product.state ?? null,
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