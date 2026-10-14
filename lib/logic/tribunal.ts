import type { CaseAnswers, CaseKind, HrCase, ProtectedReason, Settings } from '../types';

export type FlagSeverity = 'error' | 'warning' | 'success';
export interface Flag {
  severity: FlagSeverity;
  title: string;
  fix: string;
}
export type RiskLevel = 'low' | 'medium' | 'high';
export interface Assessment {
  score: number;
  level: RiskLevel;
  flags: Flag[];
}

export const PROTECTED_LABEL: Record<Exclude<ProtectedReason, 'none'>, string> = {
  discrimination: 'a discrimination complaint',
  whistleblowing: 'whistleblowing',
  pregnancy: 'pregnancy or maternity',
  health: 'a health condition or disability',
};

export const PROTECTED_OPTIONS: { id: ProtectedReason; label: string }[] = [
  { id: 'none', label: 'None of these' },
  { id: 'discrimination', label: 'A discrimination complaint' },
  { id: 'whistleblowing', label: 'Whistleblowing' },
  { id: 'pregnancy', label: 'Pregnancy or maternity' },
  { id: 'health', label: 'A health condition or disability' },
];

export const KIND_OPTIONS: { id: CaseKind; label: string }[] = [
  { id: 'conduct', label: 'Conduct' },
  { id: 'capability', label: 'Capability or performance' },
  { id: 'redundancy', label: 'Redundancy' },
  { id: 'grievance', label: 'Grievance' },
];

export const QUALIFYING_OPTIONS: { months: Settings['qualifyingMonths']; label: string }[] = [
  { months: 24, label: '2 year qualifying period' },
  { months: 6, label: '6 month qualifying period' },
  { months: 0, label: 'Day-one rights' },
];

export type QuestionKey = 'investigation' | 'invite' | 'evidence' | 'warnings' | 'appeal' | 'consistent';
export const QUESTIONS: Record<QuestionKey, { label: string; help: string }> = {
  investigation: {
    label: 'Was there a documented investigation (or for redundancy, a documented selection process)?',
    help: 'An investigation or selection record is the first thing a tribunal asks for.',
  },
  invite: {
    label: 'Was the employee invited in writing, with the right to be accompanied?',
    help: 'The Acas Code expects a written invitation and the right to bring a colleague or union rep.',
  },
  evidence: { label: 'Did they see the evidence before the meeting?', help: 'People must be able to respond to the case against them.' },
  warnings: {
    label: 'Were earlier written warnings given?',
    help: 'For conduct and capability, dismissal without earlier warnings is usually only fair for gross misconduct.',
  },
  appeal: { label: 'Was an appeal offered?', help: 'Missing an appeal is one of the most common procedural failures.' },
  consistent: {
    label: 'Have others in a similar position been treated the same way?',
    help: 'Inconsistent treatment can make a fair reason look like a pretext.',
  },
};

export const needsWarnings = (kind: CaseKind) => kind === 'conduct' || kind === 'capability';

export function assess(c: { kind: CaseKind; serviceMonths: number; answers: CaseAnswers }, qualifyingMonths: number): Assessment {
  const a = c.answers;
  const flags: Flag[] = [];
  let score = 0;

  if (a.protected !== 'none') {
    score += 40;
    flags.push({
      severity: 'error',
      title: `Linked to ${PROTECTED_LABEL[a.protected]}`,
      fix: 'These claims need no minimum length of service. Make sure the reason for the decision is clearly separate and documented.',
    });
  }
  if (a.investigation === 'no') {
    score += 20;
    flags.push(
      c.kind === 'redundancy'
        ? { severity: 'error', title: 'Selection process not documented', fix: 'Record the pool, the criteria and each score before any decision.' }
        : { severity: 'error', title: 'No documented investigation', fix: 'Complete and write up an investigation before the hearing.' },
    );
  }
  if (a.invite === 'no') {
    score += 15;
    flags.push({
      severity: 'error',
      title: 'No written invite or right to be accompanied',
      fix: 'Unreasonable failure to follow the Acas Code can raise any award by up to 25%.',
    });
  }
  if (a.evidence === 'no') {
    score += 10;
    flags.push({ severity: 'warning', title: 'Evidence not shared in advance', fix: 'Send the evidence with the invite letter so they can prepare.' });
  }
  if (a.warnings === 'no' && needsWarnings(c.kind)) {
    score += 15;
    flags.push({ severity: 'warning', title: 'No earlier written warnings', fix: 'Unless this is gross misconduct, a final warning may be the safer outcome.' });
  }
  if (a.appeal === 'no') {
    score += 12;
    flags.push({ severity: 'error', title: 'No appeal offered', fix: 'Offer an appeal heard by someone not involved so far.' });
  }
  if (a.consistent === 'no') {
    score += 12;
    flags.push({ severity: 'warning', title: 'Inconsistent treatment', fix: 'Explain in writing why this case differs from others.' });
  }
  if (a.consistent === 'unsure') {
    score += 5;
    flags.push({ severity: 'warning', title: 'Consistency not checked', fix: 'Look at how similar cases were handled in the last two years.' });
  }
  if (c.serviceMonths < qualifyingMonths && a.protected === 'none' && c.kind !== 'grievance') {
    score = Math.max(0, score - 20);
    flags.push({
      severity: 'success',
      title: `Under your ${qualifyingMonths}-month qualifying period`,
      fix: 'An ordinary unfair dismissal claim is less likely. Follow a fair process anyway.',
    });
  }
  if (!flags.length) flags.push({ severity: 'success', title: 'Process looks sound', fix: 'Keep the paper trail tidy and the decision proportionate.' });

  return { score, level: levelFor(score), flags };
}

export const levelFor = (score: number): RiskLevel => (score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low');

export const LEVEL_META: Record<RiskLevel, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  low: { label: 'Low risk', tone: 'success' },
  medium: { label: 'Medium risk', tone: 'warning' },
  high: { label: 'High risk', tone: 'error' },
};

/** Next HR reference after the highest one in use (HR-0421 becomes HR-0422). */
export function nextRef(cases: HrCase[], floor = 421): string {
  const max = cases.reduce((m, c) => Math.max(m, Number(c.ref.replace(/\D/g, '')) || 0), floor);
  return `HR-${String(max + 1).padStart(4, '0')}`;
}

export interface CaseDraft {
  id: string | null;
  ref: string;
  initials: string;
  kind: CaseKind;
  service: string;
  stage: string;
  stageInDays: number;
  answers: CaseAnswers;
}

export const blankDraft = (): CaseDraft => ({
  id: null,
  ref: '',
  initials: '',
  kind: 'conduct',
  service: '',
  stage: 'Investigation',
  stageInDays: 14,
  answers: { investigation: '', invite: '', evidence: '', warnings: '', appeal: '', consistent: '', protected: 'none' },
});

export const draftFromCase = (c: HrCase): CaseDraft => ({
  id: c.id,
  ref: c.ref,
  initials: c.initials,
  kind: c.kind,
  service: String(c.serviceMonths),
  stage: c.stage,
  stageInDays: c.stageInDays,
  answers: { ...c.answers },
});

/** Service as a number for scoring. Blank counts as 0 for the live preview only. */
export const serviceOf = (d: CaseDraft) => (d.service.trim() === '' ? 0 : Number(d.service));

export type DraftError = { field: 'initials' | 'service'; message: string } | null;

export function validateDraft(d: CaseDraft): DraftError {
  if (!d.initials.trim()) return { field: 'initials', message: 'Add the employee’s initials so you can find the case later.' };
  if (d.service.trim() === '') return { field: 'service', message: 'Add length of service in months. Use 0 if they started this month.' };
  const n = Number(d.service);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return { field: 'service', message: 'Use a whole number of months, 0 or more.' };
  if (n > 600) return { field: 'service', message: 'That is over 50 years. Check the number of months.' };
  return null;
}
