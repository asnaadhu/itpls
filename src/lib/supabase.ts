import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, YearData } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://gapnfllazdqklnylomnn.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcG5mbGxhemRxa2xueWxvbW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzM0NDMsImV4cCI6MjEwMTc0OTQ0M30.B0Ak3QxoTEFH7a93i65GEsjCpZsELfNC1Gm_cpQNQXk';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let customUrl = '';
  let customKey = '';

  if (typeof window !== 'undefined') {
    customUrl = (localStorage.getItem('supabase_custom_url') || '').trim();
    customKey = (localStorage.getItem('supabase_custom_anon_key') || '').trim();
  }

  const rawUrl = customUrl || (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const url = rawUrl.replace(/\/+$/, '');
  const anonKey = customKey || (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance || lastUsedUrl !== url || lastUsedKey !== anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false },
      });
      lastUsedUrl = url;
      lastUsedKey = anonKey;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function checkIsSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/supabase/test');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Server proxy test failed, falling back to direct client:', err);
  }

  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }

  try {
    const { error } = await client.from('app_users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { success: false, message: `Database error (${error.code}): ${error.message}` };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed.' };
  }
}

// User Persistence Helpers
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  try {
    const res = await fetch('/api/supabase/users');
    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        return data.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          email: u.email || '',
          department: u.department || '',
          password: u.password || '',
          createdAt: u.created_at || new Date().toISOString().split('T')[0],
        }));
      }
    }
  } catch (err) {
    console.warn('Server proxy fetch users failed, attempting direct client:', err);
  }

  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.from('app_users').select('*');
    if (error) {
      console.warn('Supabase fetch users error:', error.message);
      return null;
    }

    if (!data) return null;

    return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email || '',
      department: u.department || '',
      password: u.password || '',
      createdAt: u.created_at || new Date().toISOString().split('T')[0],
    }));
  } catch (err) {
    console.warn('Fetch users exception:', err);
    return null;
  }
}

export async function saveUserToSupabase(user: User): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server proxy save user failed, attempting direct client:', err);
  }

  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email || '',
      department: user.department || '',
      password: user.password || '',
      created_at: user.createdAt || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('app_users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Save user to Supabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Save user exception:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/supabase/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server proxy delete user failed, attempting direct client:', err);
  }

  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('app_users').delete().eq('id', userId);
    if (error) {
      console.warn('Delete user from Supabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Delete user exception:', err);
    return false;
  }
}

// Financial Records Helpers
export async function fetchAllFinancialRecordsFromSupabase(): Promise<Record<number, YearData> | null> {
  try {
    const res = await fetch('/api/supabase/records');
    if (res.ok) {
      const { data } = await res.json();
      if (data && Object.keys(data).length > 0) {
        return data as Record<number, YearData>;
      }
    }
  } catch (err) {
    console.warn('Server proxy fetch records failed, attempting direct client:', err);
  }

  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.from('financial_records').select('*');
    if (error) {
      console.warn('Supabase fetch records error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    const result: Record<number, YearData> = {};
    data.forEach((row: any) => {
      if (row.year && row.data) {
        result[row.year] = row.data;
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.warn('Fetch financial records exception:', err);
    return null;
  }
}

export async function syncFinancialDataToSupabase(
  year: number,
  data: YearData
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/supabase/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, data }),
    });
    const result = await res.json();
    if (res.ok) {
      return result;
    }
  } catch (err) {
    console.warn('Server proxy sync records failed, attempting direct client:', err);
  }

  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase client is not connected.' };
  }

  try {
    const payload = {
      year,
      data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('financial_records').upsert(payload, { onConflict: 'year' });
    if (error) {
      return { success: false, message: `Sync failed: ${error.message}` };
    }
    return { success: true, message: `FY ${year} records successfully synced to Supabase!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync failed.' };
  }
}
