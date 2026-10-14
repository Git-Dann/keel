import type {
  ActivityEvent,
  AiTool,
  BoardMetric,
  BoardState,
  Contract,
  ContractType,
  HrCase,
  Obligation,
  Prospect,
  WorkspaceData,
} from './types';
import { isoInDays, today } from './format';

/*
 * Seed data for the demo. Every company and person here is fictional.
 * Dates are relative to the day the demo loads, so it never goes stale.
 */

const ob = (pairs: [string, string][]): Obligation[] => pairs.map(([kind, text]) => ({ kind, text }));

function contract(
  base: Date,
  id: string,
  name: string,
  party: string,
  type: ContractType,
  value: number | null,
  renewsIn: number | null,
  noticeDays: number | null,
  autoRenews: boolean,
  owner: string,
  obligations: [string, string][],
  extra: Partial<Contract> = {},
): Contract {
  return {
    id,
    name,
    party,
    type,
    value,
    renews: renewsIn == null ? null : isoInDays(renewsIn, base),
    noticeDays,
    autoRenews,
    owner,
    obligations: ob(obligations),
    lowConfidence: [],
    reviewed: false,
    reminderSet: false,
    ...extra,
  };
}

export function seedContracts(base: Date = today()): Contract[] {
  return [
    contract(base, 'c1', 'Enterprise CRM licence', 'Northwind Software Ltd', 'Software', 48000, 38, 30, true, 'Priya Shah', [
      ['Notice', 'Written notice 30 days before renewal'],
      ['Price rise', 'Up to 7% uplift on renewal'],
      ['Minimum seats', '60 seats billed whether used or not'],
    ], { clause: '12.2 This Agreement renews automatically for successive 12 month terms unless either party gives not less than 30 days written notice.' }),
    contract(base, 'c2', 'Office lease, Manchester', 'Bright Estates plc', 'Lease', 96000, 210, 180, true, 'Tom Reid', [
      ['Break clause', 'Tenant may break on 6 months written notice'],
      ['Repair', 'Full repairing obligations on the tenant'],
      ['Rent review', 'Upward-only review at renewal'],
    ], { clause: '8.1 The Tenant may terminate this Lease on the Break Date by giving the Landlord not less than six months written notice.' }),
    contract(base, 'c3', 'Cloud hosting', 'Cobalt Cloud Ltd', 'Infrastructure', 61000, 12, 30, true, 'Priya Shah', [
      ['SLA', '99.95% monthly uptime'],
      ['Service credits', '10% credit for each 0.1% below the SLA'],
      ['Notice', '30 days before renewal'],
    ], { clause: '4.3 The Services renew for a further Term unless terminated by 30 days notice prior to the Renewal Date.' }),
    contract(base, 'c4', 'Payroll bureau', 'Ledgerly Payroll Ltd', 'Services', 18500, 75, 60, true, 'Priya Shah', [
      ['Notice', '60 days before renewal'],
      ['Data terms', 'Processor terms in Schedule 3'],
    ], { clause: '15.1 Either party may terminate on 60 days written notice expiring on the Renewal Date.' }),
    contract(base, 'c5', 'Van fleet lease', 'Arrow Leasing', 'Lease', 52000, 300, 90, false, 'Tom Reid', [
      ['Mileage cap', '12,000 miles per vehicle per year'],
      ['Return condition', 'Fair wear and tear standard applies'],
    ]),
    contract(base, 'c6', 'Brand agency retainer', 'Studio Fern', 'Services', 36000, 55, 30, true, 'Lewis Grant', [
      ['Notice', '30 days on a rolling basis'],
      ['IP', 'Assigned to Acme on payment'],
    ], { clause: '9.4 This retainer continues on a rolling basis subject to 30 days notice.' }),
    contract(base, 'c7', 'Data processing agreement', 'Mailbird Ltd', 'Data', null, null, null, false, 'Priya Shah', [
      ['Breach notice', 'Notify Acme within 48 hours of a breach'],
      ['Sub-processors', '14 days notice of any change'],
    ], { lowConfidence: ['Term', 'Value'] }),
    contract(base, 'c8', 'Cyber insurance', 'Halden Underwriting', 'Insurance', 14200, 88, 0, false, 'Priya Shah', [
      ['Disclosure', 'Material changes disclosed within 30 days'],
      ['Security condition', 'Multi-factor sign-in on all remote access'],
    ]),
    contract(base, 'c9', 'Office cleaning', 'Brightside Services', 'Facilities', 9600, 140, 90, true, 'Priya Shah', [
      ['Notice', '90 days before renewal'],
      ['Service hours', 'Five evenings a week'],
    ]),
    contract(base, 'c10', 'Product analytics', 'Quill Metrics Inc', 'Software', 22800, 22, 60, true, 'Priya Shah', [
      ['Notice', '60 days before renewal'],
      ['Overage', '£0.40 per 1,000 events over plan'],
    ], { clause: '3.1 Subscription renews automatically. Cancellation requires 60 days notice.' }),
    contract(base, 'c11', 'Recruitment PSL (draft)', 'Talentry Group', 'Services', null, null, null, false, 'Lewis Grant', [
      ['Fee', '18% of first-year salary'],
      ['Rebate', 'Sliding scale if a hire leaves within 12 weeks'],
    ], { lowConfidence: ['Term', 'Signatures'], draft: true }),
    contract(base, 'c12', 'Customer MSA', 'Halcyon Retail Group', 'Customer', 240000, 160, 90, true, 'Priya Shah', [
      ['SLA we owe', '99.9% uptime to Halcyon'],
      ['Service credits we pay', 'Up to 15% of the monthly fee'],
      ['Liability cap', 'Capped at 12 months of fees'],
    ], { clause: '7.2 Supplier shall credit Customer 5% of monthly fees for each 0.1% below the Service Level.' }),
  ];
}

const tool = (
  id: string,
  name: string,
  vendor: string,
  purpose: string,
  usedBy: string,
  tier: AiTool['tier'],
  owner: string,
  paperwork: number,
  reviewInDays: number,
): AiTool => ({ id, name, vendor, purpose, usedBy, tier, owner, paperwork, reviewInDays, dutiesDone: {}, dutiesSeeded: false });

export function seedAi(): AiTool[] {
  return [
    tool('a1', 'Team chat assistant', 'General-purpose model', 'Drafting, summarising and research', 'Everyone', 'minimal', 'IT', 100, 60),
    tool('a2', 'HireSift', 'HireSift Ltd', 'Screens and ranks job applicants', 'People team', 'high', 'Lewis Grant', 40, 14),
    tool('a3', 'Helpdesk assistant', 'Supportly', 'Answers customer questions in live chat', 'Support', 'limited', 'Amira Khan', 80, 45),
    tool('a4', 'MoodLens', 'MoodLens AI', 'Scores staff emotions on sales calls', 'Sales', 'prohibited', 'Unassigned', 10, 0),
    tool('a5', 'Code assistant', 'Developer tools vendor', 'Code completion', 'Engineering', 'minimal', 'IT', 100, 120),
    tool('a6', 'CreditCheck AI', 'Finlo', 'Assesses credit limits for sole-trader customers', 'Finance', 'high', 'Priya Shah', 55, 30),
    tool('a7', 'Campaign image maker', 'Pixelry', 'Generates ad images', 'Marketing', 'limited', 'Lewis Grant', 60, 75),
    tool('a8', 'Meeting notes', 'Notewise', 'Transcribes and summarises meetings', 'Everyone', 'minimal', 'IT', 90, 100),
    tool('a9', 'Revenue forecast model', 'Built in-house', 'Forecasts monthly revenue', 'Finance', 'unassessed', 'Priya Shah', 0, 7),
    tool('a10', 'Unknown browser extension', 'Unknown', 'Found on 9 laptops via expense claims', 'Unknown', 'unassessed', 'Unassigned', 0, 3),
  ];
}

export function seedCases(): HrCase[] {
  return [
    {
      id: 't1', ref: 'HR-0412', initials: 'J.M.', kind: 'conduct', serviceMonths: 30, stage: 'Hearing booked', stageInDays: 9,
      answers: { investigation: 'yes', invite: 'yes', evidence: 'no', warnings: 'yes', appeal: 'yes', consistent: 'unsure', protected: 'none' },
    },
    {
      id: 't2', ref: 'HR-0415', initials: 'S.K.', kind: 'capability', serviceMonths: 52, stage: 'Investigation', stageInDays: 21,
      answers: { investigation: 'yes', invite: 'no', evidence: 'no', warnings: 'no', appeal: 'no', consistent: 'yes', protected: 'health' },
    },
    {
      id: 't3', ref: 'HR-0419', initials: 'R.T.', kind: 'redundancy', serviceMonths: 14, stage: 'Consultation', stageInDays: 33,
      answers: { investigation: 'no', invite: 'yes', evidence: 'yes', warnings: 'na', appeal: 'yes', consistent: 'yes', protected: 'none' },
    },
    {
      id: 't4', ref: 'HR-0421', initials: 'A.B.', kind: 'grievance', serviceMonths: 8, stage: 'Appeal', stageInDays: 4,
      answers: { investigation: 'yes', invite: 'yes', evidence: 'yes', warnings: 'na', appeal: 'yes', consistent: 'yes', protected: 'whistleblowing' },
    },
  ];
}

export function seedProspects(): Prospect[] {
  return [
    {
      id: 'p1', name: 'Harlow & Finch', domain: 'harlowfinch.example', sector: 'Legal services', size: '320 staff', fit: 86,
      briefedDaysAgo: 3, followUpInDays: 6,
      filings: 'Revenue £41.2m (FY25), up 9%. Operating margin 14%.',
      signals: [
        { kind: 'Hiring', text: '6 legal ops roles in 30 days' },
        { kind: 'Leadership', text: 'New COO from a Big Four firm' },
        { kind: 'Expansion', text: 'Opened a Leeds office in July' },
      ],
      risk: 'Long procurement cycles. Partners vote on spend over £50k.',
    },
    {
      id: 'p2', name: 'Orbitex Logistics', domain: 'orbitex.example', sector: 'Logistics', size: '1,150 staff', fit: 72,
      briefedDaysAgo: 12, followUpInDays: 15,
      filings: 'Revenue £188m (FY25), flat. £20m facility in March.',
      signals: [
        { kind: 'Cost focus', text: 'CFO quoted on consolidating vendors' },
        { kind: 'Hiring', text: 'Procurement manager role open' },
        { kind: 'Tech', text: 'Moving off an on-premise ERP' },
      ],
      risk: 'Vendor consolidation could cut both ways.',
    },
    {
      id: 'p3', name: 'Greenmoor Care', domain: 'greenmoor.example', sector: 'Care homes', size: '640 staff', fit: 64,
      briefedDaysAgo: null, followUpInDays: 27,
      filings: 'Revenue £36.9m (FY24). Accounts filed 2 months late.',
      signals: [
        { kind: 'Regulation', text: '2 homes rated "requires improvement"' },
        { kind: 'Leadership', text: 'Interim CEO since May' },
      ],
      risk: 'Late filing and an interim CEO suggest a stretched team.',
    },
    {
      id: 'p4', name: 'Moss Lane Robotics', domain: 'mosslane.example', sector: 'Robotics', size: '45 staff', fit: 58,
      briefedDaysAgo: null, followUpInDays: 40,
      filings: null,
      signals: [
        { kind: 'Funding', text: 'Seed extension announced' },
        { kind: 'Hiring', text: '4 engineering roles open' },
      ],
      risk: 'Incorporated 8 months ago, so no accounts are filed yet.',
    },
  ];
}

export function seedBoard(): BoardState {
  return {
    meetingInDays: 17,
    sources: [
      { id: 'xero', area: 'Accounting', vendor: 'Xero', status: 'ok', hoursSinceSync: 2 },
      { id: 'hubspot', area: 'CRM', vendor: 'HubSpot', status: 'ok', hoursSinceSync: 1 },
      { id: 'linear', area: 'Delivery', vendor: 'Linear', status: 'stale', hoursSinceSync: 9 * 24 },
      { id: 'bamboohr', area: 'People', vendor: 'BambooHR', status: 'off', hoursSinceSync: null },
    ],
    sections: [
      { id: 's1', name: 'Financial summary', source: 'xero', included: true },
      { id: 's2', name: 'Pipeline and sales', source: 'hubspot', included: true },
      { id: 's3', name: 'Product delivery', source: 'linear', included: true },
      { id: 's4', name: 'People and hiring', source: 'bamboohr', included: true },
      { id: 's5', name: 'Risk register from Keel', source: 'keel', included: true },
      { id: 's6', name: 'Decisions needed from the board', source: 'manual', included: true },
    ],
    draft: null,
    sentAt: null,
  };
}

export const BOARD_METRICS: BoardMetric[] = [
  { id: 'revenue', label: 'Revenue last month', value: '£386k', delta: '+6.2%', good: true, points: [30, 32, 31, 34, 35, 33, 36, 38, 37, 40, 41, 43] },
  { id: 'burn', label: 'Net burn', value: '£128k', delta: '−4.1%', good: true, points: [20, 19, 21, 18, 17, 18, 16, 15, 16, 14, 14, 13] },
  { id: 'runway', label: 'Runway', value: '19 months', delta: '+1 month', good: true, points: [14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19] },
  { id: 'pipeline', label: 'Weighted pipeline', value: '£2.4m', delta: '−3.0%', good: false, points: [22, 24, 25, 23, 26, 27, 25, 26, 25, 24, 25, 24] },
];

export function seedActivity(now: Date = new Date()): ActivityEvent[] {
  const rows: [string, string][] = [
    ['Contracts', 'Extracted obligations from "Customer MSA"'],
    ['AI register', 'Flagged MoodLens as a prohibited practice'],
    ['Board pack', 'Delivery data is 9 days old'],
    ['Tribunal risk', 'HR-0421 marked as whistleblowing related'],
    ['Account research', 'Briefing refreshed for Harlow & Finch'],
  ];
  return rows.map(([source, message], i) => ({
    at: new Date(now.getTime() - (i + 1) * 47 * 60_000).toISOString(),
    source,
    message,
  }));
}

export function seedWorkspace(base: Date = today()): WorkspaceData {
  return {
    contracts: seedContracts(base),
    ai: seedAi(),
    cases: seedCases(),
    prospects: seedProspects(),
    board: seedBoard(),
    settings: { qualifyingMonths: 24 },
  };
}
