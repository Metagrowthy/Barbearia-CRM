'use server';

import { createClient } from '@supabase/supabase-js';

// Usamos a chave SERVICE_ROLE para ignorar as regras de RLS (Segurança) durante a criação da conta
// Isso resolve o erro 'new row violates row-level security policy' para usuários que acabaram de se cadastrar
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function createInitialTenantProfile(userId: string, fullName: string, shopName: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Aviso: SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local. Usando anon key (pode falhar por RLS).");
    }

    const slug = `${shopName.toLowerCase().replace(/ /g, '-')}-${Math.floor(Math.random() * 10000)}`;

    // 1. Criar Establishment
    const { data: newEst, error: estErr } = await supabaseAdmin
      .from('establishments')
      .insert([{ name: shopName, slug }])
      .select()
      .single();

    if (estErr || !newEst) {
      return { success: false, error: estErr?.message || 'Erro ao criar estabelecimento' };
    }

    // 2. Criar Profile
    const { data: newProfile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: userId,
        establishment_id: newEst.id,
        role: 'owner',
        full_name: fullName
      }])
      .select()
      .single();

    if (profErr || !newProfile) {
      return { success: false, error: profErr?.message || 'Erro ao criar perfil' };
    }

    return { success: true, profile: newProfile };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno do servidor' };
  }
}
