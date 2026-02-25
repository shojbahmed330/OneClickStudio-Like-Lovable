
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

export enum BuilderPhase {
  EMPTY = 'EMPTY',
  PROMPT_SENT = 'PROMPT_SENT',
  PLANNING = 'PLANNING',
  CODING = 'CODING',
  REVIEW = 'REVIEW',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  UIUX = 'UIUX',
  FIXING = 'FIXING',
  BUILDING = 'BUILDING',
  REBUILDING = 'REBUILDING',
  QUESTIONING = 'QUESTIONING',
  PREVIEW_READY = 'PREVIEW_READY',
  ITERATION = 'ITERATION'
}

export interface BuilderStatus {
  phase: BuilderPhase;
  message: string;
  timestamp: number;
  isCompleted?: boolean;
}

export type AIProvider = 'google' | 'ollama';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
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
