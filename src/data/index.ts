import { mockAppDataSource } from '@/mocks/app-data';
import { isDemoMode } from '@/lib/app-config';
import { supabaseAppDataSource } from './supabase-data-source';

export const appDataSource = isDemoMode ? mockAppDataSource : supabaseAppDataSource;

export type { AppDataSource } from './app-data-source';
export * from './types';
