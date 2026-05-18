import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';

const MOCK_USER: any = {
  id: 'demo-user-123',
  email: 'demo@nuveemob.com',
  user_metadata: {
    full_name: 'Usuário Demo',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nuvee'
  },
  isDemo: true
};

export function useAuth() {
  const [user, setUser] = useState<User | any | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsDemo = () => {
    localStorage.setItem('nuveemob_demo_user', 'true');
    setUser(MOCK_USER);
  };

  const logout = async () => {
    localStorage.removeItem('nuveemob_demo_user');
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const isDemo = localStorage.getItem('nuveemob_demo_user') === 'true';
    
    if (isDemo) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('nuveemob_demo_user')) {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, loginAsDemo, logout };
}
