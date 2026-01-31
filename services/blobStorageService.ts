
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;
export let isPersistenceEnabled = false;

// Initialize Supabase only if the environment variables are set.
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isPersistenceEnabled = true;
    console.log("[SupabaseService] Persistence is enabled via Supabase.");
  } catch (error) {
    console.error("[SupabaseService] Error initializing Supabase client:", error);
    isPersistenceEnabled = false;
  }
} else {
  console.warn("[SupabaseService] Running in LocalStorage Mode (Offline).");
  isPersistenceEnabled = false; 
}

const BUCKET_NAME = 'user-data';

const getFilePath = (userId: string, key: string): string => {
  return `${userId}/${key}.json`;
};

// --- LocalStorage Helpers for Offline Mode ---
const LOCAL_STORAGE_PREFIX = 'big_offline_data_';

const getLocalKey = (userId: string, key: string) => `${LOCAL_STORAGE_PREFIX}${userId}_${key}`;

/**
 * Fetches data. Uses Supabase if available, otherwise LocalStorage.
 */
export const get = async <T>(userId: string, key: string): Promise<T | null> => {
  // 1. Try Supabase
  if (supabase && isPersistenceEnabled) {
    try {
      const filePath = getFilePath(userId, key);
      const { data: blob, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

      if (error) {
        if (error.message === 'The resource was not found') return null;
        throw error;
      }

      if (blob) {
        const text = await blob.text();
        return JSON.parse(text) as T;
      }
    } catch (error) {
      console.error(`[SupabaseService] Error getting data:`, error);
      return null;
    }
  }

  // 2. Fallback to LocalStorage (Offline Mode)
  try {
    const localData = localStorage.getItem(getLocalKey(userId, key));
    if (localData) {
        return JSON.parse(localData) as T;
    }
  } catch (e) {
      console.error("Error reading from LocalStorage", e);
  }
  return null;
};

/**
 * Saves data. Uses Supabase if available, otherwise LocalStorage.
 */
export const set = async (userId: string, key: string, data: unknown): Promise<void> => {
  const jsonString = JSON.stringify(data);

  // 1. Try Supabase
  if (supabase && isPersistenceEnabled) {
    try {
      const filePath = getFilePath(userId, key);
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, jsonString, {
          contentType: 'application/json;charset=UTF-8',
          upsert: true,
        });

      if (error) throw error;
    } catch (error) {
      console.error(`[SupabaseService] Error setting data:`, error);
      // If upload fails, we don't fallback to local storage to avoid data sync mismatch states,
      // but in a hybrid app you might. Here we just throw.
      throw error;
    }
  } 
  
  // 2. Always save to LocalStorage as well (or as fallback)
  else {
      try {
          localStorage.setItem(getLocalKey(userId, key), jsonString);
      } catch (e) {
          console.error("Error saving to LocalStorage", e);
      }
  }
};

/**
 * Deletes data.
 */
export const del = async (userId: string, key: string): Promise<void> => {
  if (supabase && isPersistenceEnabled) {
    try {
      const filePath = getFilePath(userId, key);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      if (error) throw error;
    } catch (error) {
      console.error(`[SupabaseService] Error deleting data:`, error);
    }
  } else {
      localStorage.removeItem(getLocalKey(userId, key));
  }
};
