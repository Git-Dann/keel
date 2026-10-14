export type ModuleId = 'contracts' | 'ai' | 'tribunal' | 'accounts' | 'board';

export type ContractStatus = 'healthy' | 'upcoming' | 'due' | 'locked' | 'review' | 'expired';
export type ContractType =
  | 'Software'
  | 'Lease'
  | 'Infrastructure'
  | 'Services'
  | 'Data'
  | 'Insurance'
  | 'Facilities'
  | 'Customer';

export interface Obligation {
  kind: string;
  text: string;
}

export interface Contract {
  id: string;
  name: string;
  party: string;
  type: ContractType;
  /** Annual value in GBP. */
  value: number | null;
  /** ISO date, null when not found. */
  renews: string | null;
  noticeDays: number | null;
  autoRenews: boolean;
  owner: string;
  obligations: Obligation[];
  /** Source wording. */
  clause?: string;
  /** Fields Keel could not read with confidence. */
  lowConfidence: string[];
  reviewed: boolean;
  reminderSet: boolean;
  /** Unsigned draft, shown in the low-confidence callout. */
  draft?: boolean;
}

export type AiTier = 'prohibited' | 'high' | 'limited' | 'minimal' | 'unassessed';
export type AiUse = 'emotion' | 'hire' | 'credit' | 'chat' | 'media' | 'internal';

export interface AiTool {
  id: string;
  name: string;
  vendor: string;
  purpose: string;
  usedBy: string;
  tier: AiTier;
  /** 'Unassigned' when none. */
  owner: string;
  dutiesDone: Record<number, boolean>;
  /** Paperwork complete, 0 to 100. Seeded from the register, then derived from ticked duties. */
  paperwork: number;
  /** True once the duties have been ticked from the seeded paperwork percentage. */
  dutiesSeeded: boolean;
  reviewInDays: number;
}

export type CaseKind = 'conduct' | 'capability' | 'redundancy' | 'grievance';
export type YesNo = 'yes' | 'no' | 'unsure' | 'na' | '';
export type ProtectedReason = 'none' | 'discrimination' | 'whistleblowing' | 'pregnancy' | 'health';

export interface CaseAnswers {
  investigation: YesNo;
  invite: YesNo;
  evidence: YesNo;
  warnings: YesNo;
  appeal: YesNo;
  consistent: YesNo;
  protected: ProtectedReason;
}

export interface HrCase {
  id: string;
  ref: string;
  initials: string;
  kind: CaseKind;
  serviceMonths: number;
  stage: string;
  stageInDays: number;
  answers: CaseAnswers;
}

export interface Signal {
  kind: string;
  text: string;
}

export interface Prospect {
  id: string;
  name: string;
  domain: string;
  sector: string;
  size: string;
  fit: number;
  briefedDaysAgo: number | null;
  followUpInDays: number | null;
  filings: string | null;
  signals: Signal[];
  risk: string;
  thinData?: boolean;
}

export type SourceStatus = 'ok' | 'stale' | 'off';

export interface BoardSource {
  id: string;
  area: string;
  vendor: string;
  status: SourceStatus;
  hoursSinceSync: number | null;
}

export interface BoardSection {
  id: string;
  name: string;
  /** A BoardSource id, 'keel' or 'manual'. */
  source: string;
  included: boolean;
}

export interface BoardMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  /** Whether the movement is good news. */
  good: boolean;
  points: number[];
}

export interface BoardState {
  meetingInDays: number;
  sources: BoardSource[];
  sections: BoardSection[];
  draft: { builtAt: string; edits: Record<string, string> } | null;
  sentAt: string | null;
}

export type Severity = 'error' | 'warning';

export interface Alert {
  id: string;
  severity: Severity;
  module: ModuleId;
  title: string;
  detail: string;
  href: string;
}

export interface ActivityEvent {
  at: string;
  source: string;
  message: string;
}

export interface Settings {
  qualifyingMonths: 0 | 6 | 24;
}

export interface WorkspaceData {
  contracts: Contract[];
  ai: AiTool[];
  cases: HrCase[];
  prospects: Prospect[];
  board: BoardState;
  settings: Settings;
}

export interface HorizonEvent {
  id: string;
  module: ModuleId;
  day: number;
  title: string;
  detail: string;
  href: string;
}

export type TrayTab = 'activity' | 'alerts' | 'ask' | 'shortcuts';

export interface ChatMessage {
  id: string;
  from: 'me' | 'keel';
  text: string;
  items?: string[];
}
