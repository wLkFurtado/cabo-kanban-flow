import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';
import type { TablesInsert } from '../integrations/supabase/types';
import { useOnlineStatus } from './useOnlineStatus';

export interface UserData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  cargo?: string;
  role?: string;
  display_name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface ProfileUpdates {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  cargo?: string;
  role?: string;
  display_name?: string;
  email?: string;
  [key: string]: unknown;
}

type OpResult = { error: { message: string } | null };

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthActions {
  signUp: (email: string, password: string, userData?: UserData) => Promise<OpResult>;
  signIn: (email: string, password: string) => Promise<OpResult>;
  signOut: () => Promise<OpResult>;
  updateProfile: (updates: ProfileUpdates) => Promise<OpResult>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (!isOnline) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('Exception getting session:', err);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: 'Desconectado',
            description: 'Você foi desconectado com sucesso.',
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast, isOnline]);

  // Ensure user metadata and profiles table stay in sync for name/cargo/avatar
  useEffect(() => {
    const syncUserProfile = async () => {
      if (!user) return;
      if (!isOnline) return;

      try {
        const md: Record<string, unknown> = user.user_metadata || {};

        const getStr = (key: string) => {
          const val = md[key];
          return typeof val === 'string' ? val : undefined;
        };

        // Try to compute a reasonable full name
        const fromGivenFamily = [getStr('given_name') ?? getStr('first_name'), getStr('family_name') ?? getStr('last_name')]
          .filter(Boolean)
          .join(' ')
          .trim();
        let nextFullName: string | undefined =
          (getStr('full_name')?.trim())
            ? getStr('full_name')
            : (getStr('name')?.trim())
              ? getStr('name')
              : (fromGivenFamily || undefined);

        // Fallback to email local-part if nothing
        if (!nextFullName && user.email) {
          nextFullName = String(user.email).split('@')[0];
        }

        // Cargo resolution: prefer explicit cargo, then role if not default
        let nextCargo: string | undefined =
          (getStr('cargo')?.trim())
            ? getStr('cargo')
            : (() => {
                const r = getStr('role');
                return r && r !== 'user' ? r : undefined;
              })();

        // Avatar resolution
        let nextAvatar: string | undefined =
          (getStr('avatar_url')?.trim())
            ? getStr('avatar_url')
            : undefined;

        // Check existing profile in DB
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id, email, full_name, cargo, role, avatar_url, phone, display_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.warn('Profile fetch error:', profileFetchError);
        }

        // Prefer DB values if present
        if (profile) {
          if (!nextFullName && profile.full_name) nextFullName = profile.full_name;
          if (!nextCargo && profile.cargo) nextCargo = profile.cargo;
          if (!nextCargo && profile.role && profile.role !== 'user') nextCargo = profile.role;
          if (!nextAvatar && profile.avatar_url) nextAvatar = profile.avatar_url;
        }

        // Phone resolution
        let nextPhone: string | undefined = (getStr('phone')?.trim()) ? getStr('phone') : undefined;
        // Display name resolution
        let nextDisplayName: string | undefined = (getStr('display_name')?.trim()) ? getStr('display_name') : (nextFullName || undefined);

        // Prefer DB values if present
        if (profile) {
          if (!nextFullName && profile.full_name) nextFullName = profile.full_name;
          if (!nextCargo && profile.cargo) nextCargo = profile.cargo;
          if (!nextCargo && profile.role && profile.role !== 'user') nextCargo = profile.role;
          if (!nextAvatar && profile.avatar_url) nextAvatar = profile.avatar_url;
          if (!nextPhone && profile.phone) nextPhone = profile.phone;
          if (!nextDisplayName && profile.display_name) nextDisplayName = profile.display_name;
        }

        // Upsert profile if missing or incomplete (only patch missing fields)
        const needsProfileUpdate = !profile || !profile.full_name || !profile.cargo || !profile.avatar_url || !profile?.phone || !profile?.display_name;
        if (needsProfileUpdate) {
          const patch: TablesInsert<'profiles'> = {
            id: user.id,
            email: user.email ?? null,
            ...( (!profile || !profile.full_name) ? { full_name: nextFullName ?? null } : {} ),
            ...( (!profile || !profile.cargo) ? { cargo: nextCargo ?? null } : {} ),
            ...( (!profile || !profile.avatar_url) ? { avatar_url: nextAvatar ?? null } : {} ),
            ...( (!profile || !profile.phone) ? { phone: nextPhone ?? null } : {} ),
            ...( (!profile || !profile.display_name) ? { display_name: nextDisplayName ?? nextFullName ?? null } : {} ),
          };

          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(patch)
            .select();
          if (upsertError) {
            console.warn('Profile upsert error:', upsertError);
          }
        }

        // Update auth metadata if missing
        const needsMetadataUpdate = !(md.full_name) || !(md.cargo || md.role) || !(md.phone) || !(md.display_name);
        if (needsMetadataUpdate) {
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: {
              full_name: nextFullName,
              cargo: nextCargo,
              phone: nextPhone,
              display_name: nextDisplayName,
            },
          });
          if (updateUserError) {
            console.warn('Auth metadata update error:', updateUserError);
          }
        }
      } catch (e) {
        console.warn('syncUserProfile exception:', e);
      }
    };

    // Delay execution to avoid rate limit during signup
    const timeoutId = setTimeout(() => {
      syncUserProfile();
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [user, isOnline]);

  const signUp = async (email: string, password: string, userData: UserData = {}) => {
    try {
      if (!isOnline) {
        return { error: { message: 'Sem conexão. Tente novamente quando estiver online.' } } as OpResult;
      }
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            cargo: userData.cargo ?? userData.role,
            role: userData.role,
            avatar_url: userData.avatar_url,
            display_name: userData.display_name,
          }
        }
      });

      // Se o usuário foi criado com sucesso, criar o perfil na tabela profiles
      if (!error && data.user) {
        try {
          const profileData: TablesInsert<'profiles'> = {
            id: data.user.id,
            email: email,
            full_name: userData.full_name || null,
            phone: userData.phone || null,
            cargo: (userData.cargo ?? userData.role) || null,
            role: userData.role || 'user',
            avatar_url: userData.avatar_url || null,
            display_name: userData.display_name || userData.full_name || null,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.warn('Erro ao criar perfil:', profileError);
            // Não retornamos erro aqui para não bloquear o registro
            // O perfil será criado posteriormente pela sincronização
          }
        } catch (profileException) {
          console.warn('Exceção ao criar perfil:', profileException);
          // Não retornamos erro aqui para não bloquear o registro
        }
      }

      return { error } as OpResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: { message } } as OpResult;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!isOnline) {
        return { error: { message: 'Sem conexão. Tente novamente quando estiver online.' } } as OpResult;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error } as OpResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sign in exception:', error);
      return { error: { message } } as OpResult;
    }
  };

  const signOut = async () => {
    try {
      if (!isOnline) {
        return { error: { message: 'Sem conexão. Tente novamente quando estiver online.' } } as OpResult;
      }
      const { error } = await supabase.auth.signOut();
      return { error } as OpResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sign out exception:', error);
      return { error: { message } } as OpResult;
    }
  };

  const updateProfile = async (updates: ProfileUpdates) => {
    try {
      if (!isOnline) {
        return { error: { message: 'Sem conexão. Tente novamente quando estiver online.' } } as OpResult;
      }
      if (!user) return { error: { message: 'No user found' } } as OpResult;

      const patch: TablesInsert<'profiles'> = {
        id: user.id,
        email: updates.email ?? (user.email ?? null),
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        cargo: updates.cargo,
        phone: updates.phone,
        role: updates.role,
        display_name: updates.display_name,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(patch)
        .select();

      return { error } as OpResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { error: { message } } as OpResult;
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
}