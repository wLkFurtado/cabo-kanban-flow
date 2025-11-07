-- Script para tornar um usuário admin
-- Substitua 'SEU_USER_ID_AQUI' pelo seu User ID real

-- Primeiro, vamos verificar se o usuário já tem alguma role
SELECT ur.user_id, ur.role, p.full_name, p.email 
FROM user_roles ur 
JOIN profiles p ON ur.user_id = p.id 
WHERE ur.user_id = '623f53a2-1054-4b1a-8bbf-fe3649f92e70';

-- Se não aparecer nenhum resultado, significa que o usuário não tem role ainda
-- Neste caso, insira uma nova role de admin:
INSERT INTO user_roles (user_id, role) 
VALUES ('623f53a2-1054-4b1a-8bbf-fe3649f92e70', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Se já existir uma role, atualize para admin:
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '623f53a2-1054-4b1a-8bbf-fe3649f92e70';

-- Verificar se funcionou:
SELECT ur.user_id, ur.role, p.full_name, p.email 
FROM user_roles ur 
JOIN profiles p ON ur.user_id = p.id 
WHERE ur.user_id = '623f53a2-1054-4b1a-8bbf-fe3649f92e70';