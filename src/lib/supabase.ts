import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Product {
  id?: number;
  name: string;
  price: number;
  price_text: string;
  image: string;
  category: string;
  created_at?: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
}

export interface Order {
  id?: number;
  customer_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at?: string;
  user_id?: string;
}

// ─── Auth helpers ───────────────────────────────────────────────────────────

export interface AuthResult {
  error: string | null;
}

/** Ro'yxatdan o'tish */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });
  if (error) return { error: translateAuthError(error.message) };
  return { error: null };
}

/** Kirish */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateAuthError(error.message) };
  return { error: null };
}

/** Chiqish */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Xato xabarlarini o'zbekchaga tarjima */
function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return "Email yoki parol noto'g'ri!";
  if (msg.includes('Email not confirmed'))
    return "Email tasdiqlanmagan. Pochta qutingizni tekshiring.";
  if (msg.includes('User already registered'))
    return 'Bu email allaqachon ro\'yxatdan o\'tgan!';
  if (msg.includes('Password should be at least'))
    return "Parol kamida 6 ta belgidan iborat bo'lishi kerak!";
  if (msg.includes('Unable to validate email'))
    return "Email manzili noto'g'ri!";
  if (msg.includes('rate limit'))
    return "Juda ko'p urinish! Biroz kuting.";
  return msg;
}
