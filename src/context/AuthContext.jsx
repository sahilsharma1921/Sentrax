import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: 'citizen',
  isAdmin: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safely fetch profile from database, auto-creating a citizen profile if missing
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) return data;

      // Self-heal: If auth user exists without a profile row, insert default citizen record
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.id === userId) {
        const fallbackProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          email: authUser.email,
          phone_number: authUser.user_metadata?.phone_number || null,
          role: 'citizen', // Never elevate role here
        };
        const { data: created } = await supabase
          .from('profiles')
          .insert(fallbackProfile)
          .select()
          .maybeSingle();
        return created || fallbackProfile;
      }
      return null;
    } catch (err) {
      console.warn('Profile fetch warning:', err);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const register = async ({ email, password, fullName, phoneNumber }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      return { ...data, profile: p };
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Editable profile information (Full Name & Phone Number)
  const updateProfile = async ({ fullName, phoneNumber }) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber ? phoneNumber.trim() : null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      setProfile(p);
      return p;
    }
    return null;
  };

  const role = profile?.role || 'citizen';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);