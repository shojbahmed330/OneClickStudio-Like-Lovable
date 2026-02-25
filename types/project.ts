
import { ChatMessage } from './builder';

export enum AppMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  CONFIG = 'CONFIG',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  ADMIN = 'ADMIN',
  PROJECTS = 'PROJECTS',
  LIVE_PREVIEW = 'LIVE_PREVIEW',
  HELP = 'HELP'
}

export type WorkspaceType = 'app' | 'admin';

export interface ProjectConfig {
  appName: string;
  packageName: string;
  icon?: string; // base64
  splash?: string; // base64
  supabase_url?: string;
  supabase_key?: string;
  // Production Signing (Keystore)
  keystore_base64?: string;
  keystore_password?: string;
  key_alias?: string;
  key_password?: string;
  selected_model?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  files: Record<string, string>;
  messages?: ChatMessage[];
  config?: ProjectConfig;
  created_at: string;
  updated_at: string;
}

export interface BuildStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'skipped' | 'cancelled' | null;
  started_at?: string;
  completed_at?: string;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
}
