# Configuração do Supabase para Criação de Usuários

## Status Atual da Implementação

✅ **Concluído:**
- Modificação do `AddContactDialog` para criar usuários completos
- Atualização da função `createUserWithProfile` 
- Implementação de lógica para contornar limitações do RLS
- Testes da funcionalidade

⚠️ **Pendente:**
- Configuração final do Supabase
- Políticas RLS ou desabilitação da confirmação de email

## Problema Identificado

O sistema está criando usuários de autenticação com sucesso, mas:
1. **Confirmação de Email**: O Supabase exige confirmação de email por padrão
2. **RLS (Row Level Security)**: Impede criação de perfis sem autenticação

## Soluções Disponíveis

### Opção 1: Desabilitar Confirmação de Email (Recomendado para desenvolvimento)

1. Acesse o **Supabase Dashboard**
2. Vá para **Authentication > Settings**
3. Desabilite **"Enable email confirmations"**
4. Salve as configurações

### Opção 2: Configurar Políticas RLS

Execute as seguintes políticas SQL no **SQL Editor** do Supabase:

```sql
-- Permitir que usuários autenticados criem seus próprios perfis
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Permitir que usuários autenticados atualizem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Permitir que todos vejam perfis
CREATE POLICY "Profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Políticas similares para user_roles
CREATE POLICY "Users can create their own role" ON user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role" ON user_roles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User roles are viewable by everyone" ON user_roles
FOR SELECT USING (true);
```

### Opção 3: Usar Service Role Key (Para produção)

1. Obtenha a **Service Role Key** do Supabase Dashboard
2. Adicione ao arquivo `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```
3. Use esta chave para operações administrativas

## Como Testar

Após configurar uma das opções acima:

1. Execute o teste final:
   ```bash
   node test-final-implementation.mjs
   ```

2. Ou teste na interface:
   - Acesse `/contatos`
   - Clique em "Adicionar Contato"
   - Preencha o formulário
   - Clique em "Criar Usuário"

## Funcionalidade Implementada

O sistema agora:
- ✅ Cria usuários de autenticação no Supabase
- ✅ Tenta criar perfis automaticamente
- ✅ Fornece fallback para sincronização posterior
- ✅ Exibe senha padrão (123456) para o usuário
- ✅ Atualiza a lista de contatos automaticamente

## Próximos Passos

1. **Escolher e implementar uma das soluções acima**
2. **Testar a funcionalidade completa**
3. **Configurar políticas de segurança adequadas para produção**
4. **Implementar sistema de convites por email (opcional)**

## Arquivos Modificados

- `src/components/AddContactDialog.tsx` - Interface para criação de usuários
- `src/hooks/useProfiles.ts` - Lógica de criação de usuários e perfis
- Scripts de teste criados para validação

## Observações de Segurança

- A senha padrão (123456) deve ser alterada pelo usuário no primeiro login
- Em produção, considere implementar geração de senhas aleatórias
- Configure políticas RLS adequadas para proteger dados sensíveis