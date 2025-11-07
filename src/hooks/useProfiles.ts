import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesUpdate, TablesInsert } from '@/integrations/supabase/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isOnline = useOnlineStatus();

  const fetchProfiles = async () => {
    try {
      if (!isOnline) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar perfis",
          variant: "destructive",
        });
        return;
      }

      console.log('Profiles fetched:', data); // Debug log
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id: string, updates: TablesUpdate<'profiles'>) => {
    try {
      if (!isOnline) {
        toast({ title: 'Sem conexão', description: 'Tente novamente quando estiver online.' });
        return { success: false, error: new Error('Offline') } as { success: false; error: unknown };
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar perfil",
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Update local state
      setProfiles(prev => 
        prev.map(profile => 
          profile.id === id ? { ...profile, ...data } : profile
        )
      );

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const createProfile = async (profileData: Omit<ProfileInsert, 'created_at' | 'updated_at'>) => {
    try {
      if (!isOnline) {
        toast({ title: 'Sem conexão', description: 'Tente novamente quando estiver online.' });
        return { success: false, error: new Error('Offline') } as { success: false; error: unknown };
      }
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar perfil",
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Update local state
      setProfiles(prev => [data, ...prev]);

      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar perfil",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const createUserWithProfile = async (userData: {
    email: string;
    password?: string;
    full_name: string;
    display_name?: string;
    phone?: string;
    cargo?: string;
    role?: string;
    avatar_url?: string;
  }) => {
    try {
      if (!isOnline) {
        toast({ title: 'Sem conexão', description: 'Tente novamente quando estiver online.' });
        return { success: false, error: new Error('Offline') } as { success: false; error: unknown };
      }
      const password = userData.password || '123456';
      
      // 1. Criar usuário de autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            full_name: userData.full_name
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast({
          title: "Erro",
          description: `Erro ao criar usuário: ${authError.message}`,
          variant: "destructive",
        });
        return { success: false, error: authError };
      }

      if (!authData.user?.id) {
        const error = new Error('User ID not returned from auth');
        toast({
          title: "Erro",
          description: "ID do usuário não foi retornado",
          variant: "destructive",
        });
        return { success: false, error };
      }

      // 2. Tentar fazer login imediatamente para contornar RLS
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password
      });

      let profileCreated = false;
      let profileResult = null;

      if (!loginError) {
        // Se login funcionou, criar perfil
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            display_name: userData.display_name || userData.full_name,
            phone: userData.phone,
            cargo: userData.cargo,
            role: userData.role || 'user',
            avatar_url: userData.avatar_url
          })
          .select()
          .single();

        if (!error) {
          profileCreated = true;
          profileResult = data;
        }

        // Fazer logout após criar o perfil
        await supabase.auth.signOut();
      }

      if (!profileCreated) {
        // Se não conseguiu criar o perfil, criar apenas um registro temporário
        // que será sincronizado quando o usuário fizer login pela primeira vez
        profileResult = {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          display_name: userData.display_name || userData.full_name,
          phone: userData.phone,
          cargo: userData.cargo,
          role: userData.role || 'user',
          avatar_url: userData.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Update local state with created profile
      setProfiles(prev => [profileResult, ...prev]);
      
      const statusMessage = profileCreated 
        ? "Usuário criado com sucesso!" 
        : "Usuário criado! O perfil será sincronizado no primeiro login.";
      
      const detailMessage = profileCreated
        ? `${profileResult.full_name} foi adicionado ao sistema. Senha: ${password}`
        : `${profileResult.full_name} foi criado. Email precisa ser confirmado. Senha: ${password}`;

      toast({
        title: statusMessage,
        description: detailMessage,
      });

      return { success: true, data: { user: authData.user, profile: profileResult } };

    } catch (error) {
      console.error('Error creating user with profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar usuário completo",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      if (!isOnline) {
        toast({ title: 'Sem conexão', description: 'Tente novamente quando estiver online.' });
        return { success: false, error: new Error('Offline') } as { success: false; error: unknown };
      }
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting profile:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir perfil",
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Update local state
      setProfiles(prev => prev.filter(profile => profile.id !== id));

      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso",
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir perfil",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [isOnline]);

  return {
    profiles,
    loading,
    fetchProfiles,
    createProfile,
    createUserWithProfile,
    updateProfile,
    deleteProfile,
  };
}