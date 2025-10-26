import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Ensure environment variables are loaded before we read them.
dotenv.config();

let cachedClient: SupabaseClient | null = null;

const defaultProfilesTable = 'researcher_profiles';
const defaultCompareTable = 'research_compare_snapshots';

export const SUPABASE_TABLES = {
  profiles: process.env.SUPABASE_PROFILES_TABLE ?? defaultProfilesTable,
  researchCompareSnapshots: process.env.SUPABASE_COMPARE_TABLE ?? defaultCompareTable
} as const;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('Environment variables:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    throw new Error('SUPABASE_URL is not set. Please add it to your environment variables.');
  }

  if (!supabaseServiceRoleKey) {
    console.error('Environment variables:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) is not set.');
  }

  console.log('Creating Supabase client with URL:', supabaseUrl);

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'X-Client-Info': 'synapse-researcher-chat-server'
      }
    }
  });

  return cachedClient;
}
