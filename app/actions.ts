'use server';

import { createClient } from '@supabase/supabase-js';

// Usamos a chave SERVICE_ROLE para ignorar as regras de RLS (Segurança) durante a criação da conta
// Isso resolve o erro 'new row violates row-level security policy' para usuários que acabaram de se cadastrar
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function checkCnpjExists(cnpj: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('establishments')
      .select('id')
      .eq('cnpj', cnpj)
      .single();
    
    if (data) return { exists: true };
    return { exists: false };
  } catch (err) {
    return { exists: false };
  }
}

export async function createInitialTenantProfile(userId: string, fullName: string, shopName: string, cnpj?: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Aviso: SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local. Usando anon key (pode falhar por RLS).");
    }

    const slug = `${shopName.toLowerCase().replace(/ /g, '-')}-${Math.floor(Math.random() * 10000)}`;

    // 1. Criar Establishment
    const insertData: any = { name: shopName, slug };
    if (cnpj) {
      insertData.cnpj = cnpj;
    }

    const { data: newEst, error: estErr } = await supabaseAdmin
      .from('establishments')
      .insert([insertData])
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

export async function createEmployeeAccount(email: string, password: string, fullName: string, establishmentId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'A chave administrativa do servidor não está configurada. Contate o suporte.' };
    }

    // 1. Criar o usuário no Auth usando a API admin (não desloga o usuário atual)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Erro ao criar credencial de acesso.' };
    }

    // 2. Criar o perfil do funcionário vinculado ao estabelecimento
    const { error: profErr } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        establishment_id: establishmentId,
        role: 'employee',
        full_name: fullName
      }]);

    if (profErr) {
      // Rollback opcional: deletar usuário criado, mas por agora retornamos o erro
      return { success: false, error: profErr.message || 'Erro ao criar o perfil do funcionário.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno do servidor ao criar funcionário.' };
  }
}

