-- Script para configurar Estabelecimento e Perfis de Teste
-- Substitua os valores em 'id' pelos IDs que você encontra em Auth > Users no Supabase

-- 1. Criar uma Barbearia de Teste
INSERT INTO establishments (id, name, slug)
VALUES (
    'e63b65ef-89a3-4b6a-912c-497745778899', -- ID fixo para teste ou gen_random_uuid()
    'Barbearia Demo Premium',
    'barbearia-demo'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Vincular o usuário DONO (Acesso Total)
-- Pegue o ID do usuário que você usa para desenvolver
INSERT INTO profiles (id, establishment_id, role, full_name)
VALUES (
    'seu-id-de-usuario-dono-aqui', -- <-- COLOQUE O ID DO AUTH AQUI
    'e63b65ef-89a3-4b6a-912c-497745778899',
    'owner',
    'Dono da Barbearia'
) ON CONFLICT (id) DO UPDATE SET role = 'owner', establishment_id = 'e63b65ef-89a3-4b6a-912c-497745778899';

-- 3. Vincular o usuário FUNCIONÁRIO (Acesso Restrito)
-- Crie um segundo usuário com outro e-mail (ex: funcionario@teste.com)
INSERT INTO profiles (id, establishment_id, role, full_name)
VALUES (
    'seu-id-de-usuario-funcionario-aqui', -- <-- COLOQUE O ID DO OUTRO AUTH AQUI
    'e63b65ef-89a3-4b6a-912c-497745778899',
    'employee',
    'Barbeiro Funcionário'
) ON CONFLICT (id) DO UPDATE SET role = 'employee', establishment_id = 'e63b65ef-89a3-4b6a-912c-497745778899';
