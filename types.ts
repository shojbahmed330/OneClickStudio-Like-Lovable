
export enum GenerationMode {
  SCAFFOLD = 'scaffold',
  EDIT = 'edit',
  FIX = 'fix',
  OPTIMIZE = 'optimize'
}

export interface DependencyNode {
  file: string;
  imports: string[];
  servicesUsed: string[];
  tablesUsed: string[];
  apisUsed: string[];
}

export interface GenerationResult {
  files?: Record<string, string>;
  answer: string;
  thought?: string;
  plan?: string[];
  questions?: any[];
  mode?: GenerationMode;
}

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

export enum BuilderPhase {
  EMPTY = 'EMPTY',
  PROMPT_SENT = 'PROMPT_SENT',
  QUESTIONING = 'QUESTIONING',
  BUILDING = 'BUILDING',
  PREVIEW_READY = 'PREVIEW_READY',
  ITERATION = 'ITERATION'
}

export type WorkspaceType = 'app' | 'admin';

export type AIProvider = 'google' | 'ollama';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

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
  messages?: ChatMessage[]; // New: Store messages per project
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

export interface QuestionOption {
  id: string;
  label: string;
  subLabel?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple';
  options: QuestionOption[];
  allowOther?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  questions?: Question[];
  answersSummary?: string;
  files?: Record<string, string>;
  thought?: string;
  plan?: string[];
  isApproval?: boolean;
  model?: string;
}

export interface Package {
  id: string;
  name: string;
  tokens: number;
  price: number;
  color: string;
  icon: string;
  is_popular: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  payment_method: string;
  trx_id: string;
  screenshot_url?: string;
  message?: string;
  created_at: string;
  user_email?: string; // Virtual field for admin
}

export interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  details: string;
  created_at: string;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  tokens: number;
  isLoggedIn: boolean;
  joinedAt: number;
  isAdmin?: boolean;
  is_banned?: boolean;
  bio?: string;
  is_verified?: boolean;
  github_token?: string;
  github_owner?: string;
  github_repo?: string;
}
