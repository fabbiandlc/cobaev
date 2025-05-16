import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These are the Supabase project details you provided
const supabaseUrl = 'https://kxouxgxfjqryamgvmmxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4b3V4Z3hmanFyeWFtZ3ZtbXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNTE1NzksImV4cCI6MjA2MjkyNzU3OX0.xFenRS49Xi5pqebB9mcw7zdM--NMmPfHXIFjwjJY9UA';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth methods
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  await AsyncStorage.removeItem('isLoggedIn');
  await AsyncStorage.removeItem('userEmail');
  return true;
};

export const getSession = async () => {
  // For older versions of Supabase, use auth.session()
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export { supabase };
