import type { Contract, ContractStatus } from '../types';
import { daysUntil, fmtDate, isoInDays, parseDate, today } from '../format';
import { addDays, format } from 'date-fns';

export type Tone = 'success' | 'blue' | 'warning' | 'error' | 'gray' | 'brand';

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: Tone; tip: string }> = {
  healthy: { label: 'Healthy', tone: 'success', tip: 'Nothing to do yet. Keel will remind you before any notice window opens.' },
  upcoming: { label: 'Renewing soon', tone: 'blue', tip: 'Renews within 90 days. No notice is needed, but plan the conversation now.' },
  due: { label: 'Notice due', tone: 'warning', tip: 'The notice window closes within 30 days. Act now if you want to renegotiate or leave.' },
  locked: { label: 'Notice missed', tone: 'error', tip: 'The notice deadline has passed, so this renews automatically. You can still negotiate, but with less leverage.' },
  review: { label: 'Needs review', tone: 'gray', tip: 'Keel could not read some key terms with confidence. Check them before relying on the dates.' },
  expired: { label: 'Expired', tone: 'gray', tip: 'The term has ended. Archive it or upload the renewal.' },
};

/** Renewal date minus the notice period, or null if either is missing. */
export function noticeBy(c: Pick<Contract, 'renews' | 'noticeDays'>): string | null {
  if (!c.renews || c.noticeDays == null) return null;
  return format(addDays(parseDate(c.renews), -c.noticeDays), 'yyyy-MM-dd');
}

export function contractStatus(c: Contract, base: Date = today()): ContractStatus {
  if (!c.renews || c.lowConfidence.length > 0) return 'review';
  const r = daysUntil(c.renews, base);
  if (r < 0) return 'expired';
  const nb = noticeBy(c);
  const n = nb ? daysUntil(nb, base) : null;
  if (c.autoRenews && n != null && n < 0) return 'locked';
  if (c.autoRenews && n != null && n <= 30) return 'due';
  if (r <= 90) return 'upcoming';
  return 'healthy';
}

export type ContractFilter = 'all' | 'due' | 'locked' | 'review' | 'healthy';

export function filterContracts(list: Contract[], filter: ContractFilter, query: string, base: Date = today()): Contract[] {
  const q = query.trim().toLowerCase();
  return list
    .filter((c) => filter === 'all' || contractStatus(c, base) === filter)
    .filter((c) => !q || `${c.name} ${c.party} ${c.type}`.toLowerCase().includes(q))
    .sort((a, b) => (a.renews ? daysUntil(a.renews, base) : -1) - (b.renews ? daysUntil(b.renews, base) : -1));
}

export function countByStatus(list: Contract[], base: Date = today()): Record<ContractStatus, number> {
  const out: Record<ContractStatus, number> = { healthy: 0, upcoming: 0, due: 0, locked: 0, review: 0, expired: 0 };
  for (const c of list) out[contractStatus(c, base)]++;
  return out;
}

/** What the "Give notice by" column shows. */
export function noticeCell(c: Contract): { kind: 'date'; iso: string } | { kind: 'text'; text: string } {
  const nb = noticeBy(c);
  if (!c.renews) return { kind: 'text', text: 'Not found' };
  if (!c.autoRenews) return { kind: 'text', text: 'Does not auto-renew' };
  if (!nb) return { kind: 'text', text: 'Not found' };
  return { kind: 'date', iso: nb };
}

export function noticeLetter(c: Contract): string {
  return `Dear ${c.party},

Re: ${c.name}

We write to give notice that we do not intend to renew this agreement on its current terms when the term ends on ${fmtDate(c.renews)}.

We would welcome a conversation about revised terms before that date. Please treat this letter as formal written notice under the agreement.

Kind regards,

Dan
Acme Group`;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ACCEPTED = /\.(pdf|docx?)$/i;

/** Returns an error message that says how to fix it, or null when the file is fine. */
export function validateUpload(file: { name: string; size: number }): string | null {
  if (!ACCEPTED.test(file.name)) return `"${file.name}" is not a PDF or Word file. Save it as PDF, DOC or DOCX and try again.`;
  if (file.size === 0) return 'That file is empty. Check it opens on your computer, then try again.';
  if (file.size > MAX_UPLOAD_BYTES)
    return `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 25 MB. Remove scanned appendices or split it, then try again.`;
  return null;
}

/** "acme_supply-agreement.pdf" becomes "Acme supply agreement". */
export function nameFromFile(fileName: string): string {
  const n = fileName.replace(ACCEPTED, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!n) return 'Untitled contract';
  return n[0].toUpperCase() + n.slice(1);
}

export function isDuplicateName(list: Contract[], name: string): boolean {
  return list.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
}

/** The contract Keel "extracts" from an upload. */
export function extractedContract(id: string, name: string, party: string, base: Date = today()): Contract {
  return {
    id,
    name,
    party,
    type: 'Services',
    value: 24000,
    renews: isoInDays(118, base),
    noticeDays: 90,
    autoRenews: true,
    owner: 'Dan',
    obligations: [
      { kind: 'Notice', text: '90 days before renewal' },
      { kind: 'Payment', text: '30 days from invoice' },
    ],
    clause: 'The Agreement shall automatically renew for successive periods of 12 months unless terminated by either party on 90 days notice.',
    lowConfidence: ['Annual value'],
    reviewed: false,
    reminderSet: false,
  };
}

export const SAMPLE_CONTRACT = { name: 'Telephony services agreement', party: 'Clearline Comms Ltd' };
