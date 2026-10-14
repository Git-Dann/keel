'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card } from '@/components/ui/Primitives';
import { SelectField, TextField } from '@/components/ui/Fields';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  assess, KIND_OPTIONS, LEVEL_META, needsWarnings, PROTECTED_OPTIONS, QUESTIONS, serviceOf, validateDraft,
  type CaseDraft, type QuestionKey,
} from '@/lib/logic/tribunal';
import type { CaseKind, ProtectedReason, YesNo } from '@/lib/types';
import { YesNoField } from './YesNo';
import { RiskMeter } from './RiskMeter';

const FLAG = {
  error: { box: 'bg-utility-red-50 ring-utility-red-200', Icon: AlertCircle, ic: 'text-utility-red-600', sr: 'Fix: ' },
  warning: { box: 'bg-utility-yellow-50 ring-utility-yellow-200', Icon: AlertTriangle, ic: 'text-utility-yellow-600', sr: 'Check: ' },
  success: { box: 'bg-utility-green-50 ring-utility-green-200', Icon: CheckCircle, ic: 'text-utility-green-600', sr: 'Good: ' },
};

export function Checker({
  draft,
  onChange,
  qualifyingMonths,
  onSave,
  onClose,
}: {
  draft: CaseDraft;
  onChange: (d: CaseDraft) => void;
  qualifyingMonths: number;
  onSave: (d: CaseDraft) => void;
  onClose: () => void;
}) {
  const [errors, setErrors] = useState<{ initials?: string; service?: string }>({});
  const initialsRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<HTMLInputElement>(null);
  const result = useMemo(() => assess({ kind: draft.kind, serviceMonths: serviceOf(draft), answers: draft.answers }, qualifyingMonths), [draft, qualifyingMonths]);
  const level = LEVEL_META[result.level];

  const setAnswer = (k: QuestionKey, v: YesNo) => onChange({ ...draft, answers: { ...draft.answers, [k]: v } });
  const questions: QuestionKey[] = ['investigation', 'invite', 'evidence', ...(needsWarnings(draft.kind) ? (['warnings'] as const) : []), 'appeal', 'consistent'];

  const save = () => {
    const err = validateDraft(draft);
    if (err) {
      setErrors({ [err.field]: err.message });
      (err.field === 'initials' ? initialsRef : serviceRef).current?.focus();
      return;
    }
    setErrors({});
    onSave(draft);
  };

  return (
    <Card aria-labelledby="checker-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-5 py-4">
        <div className="min-w-0">
          <h2 id="checker-title" className="text-lg font-semibold text-primary">
            {draft.id ? `${draft.ref} · ${draft.initials || 'no initials'}` : 'New check'}
          </h2>
          <p className="mt-0.5 text-sm text-tertiary">Answers update the risk as you go</p>
        </div>
        <span aria-live="polite" aria-atomic="true">
          <span className="sr-only">Risk level: </span>
          <StatusBadge tone={level.tone} size="md">
            {level.label}
          </StatusBadge>
        </span>
      </div>

      <form
        className="flex flex-col gap-5 px-5 py-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            ref={initialsRef}
            label="Employee initials"
            help="Keel only stores initials. Keep names and full details in your HR system."
            value={draft.initials}
            maxLength={6}
            placeholder="J.M."
            autoComplete="off"
            error={errors.initials}
            onChange={(e) => {
              onChange({ ...draft, initials: e.target.value });
              if (errors.initials) setErrors((x) => ({ ...x, initials: undefined }));
            }}
          />
          <TextField
            ref={serviceRef}
            label="Length of service (months)"
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            step={1}
            placeholder="18"
            value={draft.service}
            error={errors.service}
            onChange={(e) => {
              onChange({ ...draft, service: e.target.value });
              if (errors.service) setErrors((x) => ({ ...x, service: undefined }));
            }}
          />
        </div>
        <SelectField
          label="Type of case"
          value={draft.kind}
          options={KIND_OPTIONS.map((k) => ({ value: k.id, label: k.label }))}
          onChange={(e) => {
            const kind = e.target.value as CaseKind;
            onChange({ ...draft, kind, answers: { ...draft.answers, warnings: needsWarnings(kind) ? (draft.answers.warnings === 'na' ? '' : draft.answers.warnings) : 'na' } });
          }}
        />
        {questions.map((k) => (
          <YesNoField key={k} label={QUESTIONS[k].label} help={QUESTIONS[k].help} value={draft.answers[k]} onChange={(v) => setAnswer(k, v)} notRelevant={k === 'warnings'} />
        ))}
        <SelectField
          label="Has the employee raised any of these?"
          help="Discrimination, whistleblowing, pregnancy and health-related claims can be brought from day one, so length of service gives no protection."
          value={draft.answers.protected}
          options={PROTECTED_OPTIONS.map((p) => ({ value: p.id, label: p.label }))}
          onChange={(e) => onChange({ ...draft, answers: { ...draft.answers, protected: e.target.value as ProtectedReason } })}
        />

        <section aria-labelledby="fix-h" className="border-t border-secondary pt-5" aria-live="polite">
          <RiskMeter level={result.level} score={result.score} />
          <h3 id="fix-h" className="mt-5 mb-3 text-md font-semibold text-primary">
            What to fix
          </h3>
          <ul className="flex flex-col gap-2">
            {result.flags.map((f) => {
              const s = FLAG[f.severity];
              return (
                <li key={f.title} className={cx('flex gap-3 rounded-lg px-4 py-3 ring-1 ring-inset', s.box)}>
                  <s.Icon className={cx('mt-0.5 size-5 shrink-0', s.ic)} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      <span className="sr-only">{s.sr}</span>
                      {f.title}
                    </p>
                    <p className="text-sm text-secondary">{f.fix}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-quaternary">A checklist, not legal advice. Speak to an employment lawyer before a decision you are unsure about.</p>
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-secondary pt-4">
          {draft.id && (
            <Button type="button" color="secondary-destructive" size="md" onPress={onClose}>
              Close case
            </Button>
          )}
          <Button type="submit" color="primary" size="md" iconLeading={Check}>
            {draft.id ? 'Save changes' : 'Save case'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
