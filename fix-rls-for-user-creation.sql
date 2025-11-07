-- Política para permitir que usuários autenticados criem seus próprios perfis
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários autenticados criem seus próprios user_roles
CREATE POLICY "Users can create their own user_role" ON user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários vejam todos os perfis (necessário para a lista de contatos)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (true);

-- Política para permitir que usuários vejam todos os user_roles
CREATE POLICY "Users can view all user_roles" ON user_roles
FOR SELECT USING (true);

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios user_roles
CREATE POLICY "Users can update their own user_role" ON user_roles
FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que admins façam qualquer coisa
CREATE POLICY "Admins can do anything on profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can do anything on user_roles" ON user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);