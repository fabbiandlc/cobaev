import { supabase } from './supabase';

// Database Tables
export const TABLES = {
  DOCENTES: 'docentes',
  MATERIAS: 'materias',
  GRUPOS: 'grupos',
  DIRECTIVOS: 'directivos',
  HORARIOS: 'horarios',
  ACTIVIDADES: 'actividades',
} as const;

// Database operations
export const database = {
  // Fetch all data
  async fetchAllData() {
    try {
      const [
        { data: docentes },
        { data: materias },
        { data: grupos },
        { data: directivos },
        { data: horarios },
        { data: actividades },
      ] = await Promise.all([
        supabase.from(TABLES.DOCENTES).select('*'),
        supabase.from(TABLES.MATERIAS).select('*'),
        supabase.from(TABLES.GRUPOS).select('*'),
        supabase.from(TABLES.DIRECTIVOS).select('*'),
        supabase.from(TABLES.HORARIOS).select('*'),
        supabase.from(TABLES.ACTIVIDADES).select('*'),
      ]);

      return {
        docentes: docentes || [],
        materias: materias || [],
        grupos: grupos || [],
        directivos: directivos || [],
        horarios: horarios || [],
        actividades: actividades || [],
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  // CRUD operations for each table
  async addItem(table: string, item: any) {
    const { data, error } = await supabase
      .from(table)
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateItem(table: string, id: string, updates: any) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteItem(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Specific methods for each table
  async getDocentes() {
    const { data, error } = await supabase.from(TABLES.DOCENTES).select('*');
    if (error) throw error;
    return data || [];
  },

  async getMaterias() {
    const { data, error } = await supabase.from(TABLES.MATERIAS).select('*');
    if (error) throw error;
    return data || [];
  },

  async getGrupos() {
    const { data, error } = await supabase.from(TABLES.GRUPOS).select('*');
    if (error) throw error;
    return data || [];
  },

  async getDirectivos() {
    const { data, error } = await supabase.from(TABLES.DIRECTIVOS).select('*');
    if (error) throw error;
    return data || [];
  },

  async getHorarios() {
    const { data, error } = await supabase.from(TABLES.HORARIOS).select('*');
    if (error) throw error;
    return data || [];
  },

  async getActividades() {
    const { data, error } = await supabase.from(TABLES.ACTIVIDADES).select('*');
    if (error) throw error;
    return data || [];
  },
};
