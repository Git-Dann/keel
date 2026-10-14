import type { Alert, WorkspaceData } from '../types';
import { contractStatus, noticeBy } from './contracts';
import { assess } from './tribunal';
import { problemSources, sourceDays } from './board';
import { fmtDate, today } from '../format';

export function buildAlerts(d: WorkspaceData, base: Date = today()): Alert[] {
  const out: Alert[] = [];
  for (const c of d.contracts) {
    const st = contractStatus(c, base);
    if (st === 'locked')
      out.push({ id: `al-${c.id}`, severity: 'error', module: 'contracts', title: `${c.name} renews automatically`, detail: `Notice deadline passed. Renews ${fmtDate(c.renews)}.`, href: `/contracts?open=${c.id}` });
    if (st === 'due')
      out.push({ id: `al-${c.id}`, severity: 'warning', module: 'contracts', title: `Notice due for ${c.name}`, detail: `Give notice by ${fmtDate(noticeBy(c))}.`, href: `/contracts?open=${c.id}` });
  }
  for (const t of d.ai) {
    if (t.tier === 'prohibited')
      out.push({ id: `al-${t.id}`, severity: 'error', module: 'ai', title: `${t.name} looks prohibited`, detail: 'This use is banned under the EU AI Act. Stop using it.', href: `/ai?open=${t.id}` });
  }
  for (const c of d.cases) {
    const r = assess(c, d.settings.qualifyingMonths);
    if (r.level === 'high') {
      const n = r.flags.filter((f) => f.severity !== 'success').length;
      out.push({ id: `al-${c.id}`, severity: 'error', module: 'tribunal', title: `${c.ref} is high risk`, detail: `${n} ${n === 1 ? 'issue' : 'issues'} to fix before the ${c.stage.toLowerCase()} stage.`, href: `/tribunal?open=${c.id}` });
    }
  }
  for (const s of problemSources(d.board)) {
    out.push({
      id: `al-${s.id}`,
      severity: 'warning',
      module: 'board',
      title: s.status === 'off' ? `${s.vendor} is disconnected` : `${s.vendor} data is ${sourceDays(s)} days old`,
      detail: 'The next board pack will be incomplete.',
      href: '/board',
    });
  }
  // Stable sort: errors before warnings, original order otherwise.
  return out.map((a, i) => [a, i] as const).sort((x, y) => sev(x[0]) - sev(y[0]) || x[1] - y[1]).map(([a]) => a);
}

const sev = (a: Alert) => (a.severity === 'error' ? 0 : 1);

export const visibleAlerts = (all: Alert[], dismissed: string[]): Alert[] => all.filter((a) => !dismissed.includes(a.id));
