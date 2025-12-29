
export interface AudioContent {
  type: 'audio';
  data: string; 
  format: 'wav' | 'mp3' | 'opus' | 'flac';
  sampleRate?: number;
  duration?: number;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string; 
  format: 'jpeg' | 'png' | 'webp' | 'gif';
}

export type ContentPart = TextContent | ImageContent | AudioContent;
export type Modality = 'audio' | 'text' | 'image';


export interface AccelerateAction {
  enabled: boolean;
  percent: number; 
}

export interface TrimSilenceAction {
  enabled: boolean;
  threshold?: number; 
  minDuration?: number; 
}

export interface AudioActions {
  accelerate?: AccelerateAction;
  trimSilence?: TrimSilenceAction;
}

export interface AudioPolicy {
  enabled: boolean;
  actions: AudioActions;
}

export interface TextPolicy {
  enabled: boolean;
  actions: TextActions;
}

export interface ImagePolicy {
  enabled: boolean;
  actions: Record<string, never>;
}

export interface Policy {
  audio: AudioPolicy;
  text: TextPolicy;
  image: ImagePolicy;
}

export interface TrimWhitespaceAction {
  enabled: boolean;
  aggressive?: boolean;
}

export interface RemoveStopWordsAction {
  enabled: boolean;
  language?: 'en' | 'pt';
}

export interface TextActions {
  trimWhitespace?: TrimWhitespaceAction;
  removeStopWords?: RemoveStopWordsAction;
}

export interface TextPolicy {
  enabled: boolean;
  actions: TextActions;
}

// =============================================================================
// STAGE 
// =============================================================================

export interface StageResult<T extends ContentPart> {
  content: T;
  unitsBefore: number; 
  unitsAfter: number;
  durationMs: number;
}

export interface Stage<T extends ContentPart = ContentPart> {
  name: string;
  modality: Modality;
  actionKey: string;
  order: number;
  contentType: T['type'];
  enabled(policy: Policy): boolean;
  process(content: T, actionConfig: unknown): Promise<StageResult<T>>;
}

// =============================================================================
// USAGE & SAVINGS
// =============================================================================

export interface Usage {
  textChars: number;
  audioBytes: number;
  imageBytes: number;
}

export const EMPTY_USAGE: Usage = {
  textChars: 0,
  audioBytes: 0,
  imageBytes: 0,
};

export interface Savings {
  textCharsSaved: number;
  audioBytesSaved: number;
  imageBytesSaved: number;
}

export const EMPTY_SAVINGS: Savings = {
  textCharsSaved: 0,
  audioBytesSaved: 0,
  imageBytesSaved: 0,
};

// =============================================================================
// REPORT 
// =============================================================================

export interface StageMetrics {
  name: string;
  modality: Modality;
  actionKey: string;
  unitsBefore: number;
  unitsAfter: number;
  unitsSaved: number;
  durationMs: number;
}

export interface Report {
  usageBefore: Usage;
  usageAfter: Usage;
  savings: Savings;
  stages: StageMetrics[];
  totalDurationMs: number;
}

// =============================================================================
// STEAL RESULT
// =============================================================================

export interface AuditEvent {
  stage: string;
  action: 'PROCESS' | 'SKIP' | 'ERROR';
  reason: string;
  contentIndex?: number;
}

export interface StealResult {
  contents: ContentPart[];
  audit: AuditEvent[];
  report: Report;
}

