import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ximkltsvydnzvudfojay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BC6S7Wpdm_0tEugFze-7FQ_qPcV9o3K';

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
  const { data, error } = await supabase.from('gender').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getEthnicities() {
  const { data, error } = await supabase.from('ethnicity').select('id, name').order('name');
  if (error) throw error;
  return data ?? [];
}

// ─── Product helpers ──────────────────────────────────────────────────────────

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  status: string;
  created_at: string;
  category: { name: string } | null;
  condition: { name: string } | null;
  images: { url: string; display_order: number }[];
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      price,
      status,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      images:product_image ( url, display_order )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Sort images by display_order for each product
  return (data ?? []).map((p: any) => ({
    ...p,
    images: (p.images ?? []).sort(
      (a: any, b: any) => a.display_order - b.display_order,
    ),
  }));
}

// ─── Product Detail ────────────────────────────────────────────────────────────

export interface ProductDetail extends Product {
  seller: { full_name: string | null } | null;
}

export async function getProductById(id: number): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('product')
    .select(`
      id,
      title,
      description,
      price,
      status,
      created_at,
      category:category_id ( name ),
      condition:condition_id ( name ),
      images:product_image ( url, display_order ),
      seller:user_id ( full_name )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    images: ((data as any).images ?? []).sort(
      (a: any, b: any) => a.display_order - b.display_order,
    ),
    seller: (data as any).seller ?? null,
  } as ProductDetail;
}




// Publicaciones de productos

// ─── Create Product & Upload Helpers ──────────────────────────────────────────

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  category_id: number | null;
  condition_id: number | null;
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
      status: 'active',
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

  // 3. Subir al bucket "PRODUCT"
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
  url: string,
  displayOrder: number
) {
  const { error } = await supabase.from('product_image').insert({
    product_id: productId,
    url,
    display_order: displayOrder,
  });

  if (error) throw error;
}