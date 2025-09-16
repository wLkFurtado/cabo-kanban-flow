import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthActions {
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('useAuth - Getting initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('useAuth - Session result:', { session: !!session, error: error?.message });
        
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('useAuth - Exception getting session:', err);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('useAuth - Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth - Auth state changed:', { event, session: !!session });
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
  }, [toast]);

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role || 'user',
          }
        }
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('useAuth - Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('useAuth - Sign in result:', { error: error?.message });

      return { error };
    } catch (error) {
      console.error('useAuth - Sign in exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('useAuth - Signing out...');
      const { error } = await supabase.auth.signOut();
      console.log('useAuth - Sign out result:', { error: error?.message });
      return { error };
    } catch (error) {
      console.error('useAuth - Sign out exception:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) return { error: 'No user found' };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      return { error };
    } catch (error) {
      return { error };
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