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

export async function updateEmployeePassword(fullName: string, newPassword: string, establishmentId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'A chave administrativa do servidor não está configurada.' };
    }

    // 1. Find the profile of the employee
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('full_name', fullName)
      .eq('establishment_id', establishmentId)
      .single();

    if (profErr || !profile) {
      return { success: false, error: 'Funcionário não encontrado no sistema.' };
    }

    // 2. Update the user password in auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (authError) {
      return { success: false, error: authError.message || 'Erro ao atualizar a senha.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno do servidor ao atualizar a senha.' };
  }
}

export async function updateProfileCredentials(userId: string, newEmail?: string, newPassword?: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'A chave administrativa não está configurada.' };
    }

    const updates: any = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;

    // Use admin API to bypass email confirmation requirements
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);

    if (error) {
      return { success: false, error: error.message || 'Erro ao atualizar credenciais.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno do servidor.' };
  }
}

export async function updateEmployeeRole(fullName: string, newRole: string, establishmentId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'A chave administrativa não está configurada.' };
    }

    const { data: profile, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('full_name', fullName)
      .eq('establishment_id', establishmentId)
      .single();

    if (searchError || !profile) {
      return { success: false, error: 'Perfil do funcionário não encontrado.' };
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);

    if (updateError) {
      return { success: false, error: updateError.message || 'Erro ao atualizar o nível de acesso.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro interno do servidor ao atualizar o nível de acesso.' };
  }
}

export async function getEstablishmentProfiles(establishmentId: string) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('establishment_id', establishmentId);
      
    if (error) throw error;

    // Buscar os usuários do auth para obter os e-mails
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    
    const userEmailMap = new Map<string, string>();
    if (!usersErr && users) {
      users.forEach(u => {
        if (u.email) {
          userEmailMap.set(u.id, u.email);
        }
      });
    }

    const profilesWithEmail = (profiles || []).map(p => ({
      ...p,
      email: userEmailMap.get(p.id) || ''
    }));

    return { success: true, data: profilesWithEmail };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

