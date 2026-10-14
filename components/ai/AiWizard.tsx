'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Checkbox } from '@/components/ui/untitled/base/checkbox/checkbox';
import { ModalDialog } from '@/components/ui/Overlay';
import { Callout } from '@/components/ui/Primitives';
import { TextField } from '@/components/ui/Fields';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { newId, useKeel } from '@/lib/store';
import { toast, useOverlay, type WizardState } from '@/lib/ui-store';
import { AI_USES, newTool, TIER_DUTIES, TIER_META, tierFromUses } from '@/lib/logic/ai';
import type { AiUse } from '@/lib/types';

export function AiWizard() {
  const wizard = useOverlay((s) => s.wizard);
  const setOverlay = useOverlay((s) => s.set);
  const close = () => setOverlay({ wizard: null });
  const tool = useKeel((s) => (wizard?.toolId ? s.data.ai.find((a) => a.id === wizard.toolId) : undefined));
  const reassessing = !!wizard?.toolId;
  return (
    <ModalDialog isOpen={!!wizard} onClose={close} title={reassessing ? `Reassess ${tool?.name ?? 'tool'}` : 'Add an AI tool'} subtitle={wizard ? <StepLabel /> : undefined}>
      {wizard && <WizardBody key={wizard.toolId ?? 'new'} start={wizard} onDone={close} />}
    </ModalDialog>
  );
}

function StepLabel() {
  const step = useOverlay((s) => s.wizard?.step ?? 1);
  return <>Step {step} of 3</>;
}

function WizardBody({ start, onDone }: { start: WizardState; onDone: () => void }) {
  const router = useRouter();
  const setOverlay = useOverlay((s) => s.set);
  const data = useKeel((s) => s.data);
  const addTool = useKeel((s) => s.addTool);
  const reassessTool = useKeel((s) => s.reassessTool);
  const existing = start.toolId ? data.ai.find((a) => a.id === start.toolId) : undefined;
  const step = useOverlay((s) => s.wizard?.step ?? start.step);
  const setStep = (n: 1 | 2 | 3) => setOverlay({ wizard: { ...start, step: n } });

  const [name, setName] = useState(existing?.name ?? '');
  const [vendor, setVendor] = useState(existing?.vendor ?? '');
  const [owner, setOwner] = useState(existing && existing.owner !== 'Unassigned' ? existing.owner : '');
  const [uses, setUses] = useState<AiUse[]>([]);
  const [nameError, setNameError] = useState('');
  const [usesError, setUsesError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const tier = tierFromUses(uses);
  const meta = TIER_META[tier];

  const next = () => {
    if (step === 1) {
      if (!name.trim()) {
        setNameError('Give the tool a name so people can find it.');
        nameRef.current?.focus();
        return;
      }
      setNameError('');
      setStep(2);
    } else if (step === 2) {
      if (!uses.length) {
        setUsesError('Pick at least one use, or go back and save it as not assessed.');
        return;
      }
      setUsesError('');
      setStep(3);
    }
  };

  const save = (asUnassessed = false) => {
    const chosenUses = asUnassessed ? [] : uses;
    const t = tierFromUses(chosenUses);
    if (existing) {
      const changed = existing.tier !== t;
      reassessTool(existing.id, t);
      useKeel.setState((s) => ({
        data: {
          ...s.data,
          ai: s.data.ai.map((a) =>
            a.id === existing.id ? { ...a, name: name.trim() || a.name, vendor: vendor.trim() || a.vendor, owner: owner.trim() || 'Unassigned' } : a,
          ),
        },
      }));
      toast('Reassessed', `${name.trim() || existing.name}: ${TIER_META[t].label}.${changed ? ' Paperwork was reset because the tier changed.' : ''}`);
      onDone();
      router.push(`/ai?open=${existing.id}`);
      return;
    }
    if (data.ai.some((a) => a.name.trim().toLowerCase() === name.trim().toLowerCase()))
      toast('Already on the register', `There is another tool called "${name.trim()}". Both are kept, so check which one is current.`, 'warning');
    const tool = newTool(newId('a'), { name, vendor, owner, uses: chosenUses });
    addTool(tool);
    toast('Added to register', `${tool.name}: ${TIER_META[tool.tier].label}.`);
    onDone();
    router.push(`/ai?open=${tool.id}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={cx('h-1.5 flex-1 rounded-full', n <= step ? 'bg-fg-brand-secondary' : 'bg-quaternary')} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <TextField
            ref={nameRef}
            label="Tool name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError && e.target.value.trim()) setNameError('');
            }}
            placeholder="For example, HireSift"
            error={nameError}
            maxLength={80}
          />
          <TextField
            label="Vendor"
            help={'Write "Built in-house" for your own models, or "Unknown" if you are not sure yet.'}
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="The company that makes it"
            maxLength={80}
          />
          <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who answers for this tool" hint="Leave blank and Keel flags it as unassigned." maxLength={60} />
        </div>
      )}

      {step === 2 && (
        <fieldset aria-describedby={usesError ? 'uses-error' : 'uses-hint'}>
          <legend className="text-sm font-medium text-secondary">What is {name.trim() || 'it'} used for?</legend>
          <p id="uses-hint" className="mt-1 text-sm text-tertiary">
            Tick everything that applies. The riskiest use decides the tier.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {AI_USES.map((u) => (
              <li key={u.id} className="rounded-lg border border-secondary px-4 py-3 has-[[data-selected]]:border-utility-brand-300 has-[[data-selected]]:bg-utility-brand-50">
                <Checkbox
                  size="md"
                  label={u.label}
                  isSelected={uses.includes(u.id)}
                  onChange={(v) => {
                    setUses((prev) => (v ? [...prev, u.id] : prev.filter((x) => x !== u.id)));
                    if (v) setUsesError('');
                  }}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
          {usesError && (
            <p id="uses-error" role="alert" className="mt-3 text-sm text-error-primary">
              {usesError}
            </p>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <div aria-live="polite">
          <div className="flex flex-col items-center py-2 text-center">
            <StatusBadge tone={meta.tone} size="md">
              {meta.label}
            </StatusBadge>
            <h3 className="mt-3 text-lg font-semibold break-words text-primary">
              {name.trim()} looks {meta.label.toLowerCase()}
            </h3>
            <p className="mt-1 max-w-[46ch] text-sm text-tertiary">{meta.tip}</p>
          </div>
          <h4 className="mt-4 text-sm font-semibold text-primary">What you will need</h4>
          <ul className="mt-2 flex flex-col gap-2">
            {TIER_DUTIES[tier].map((d) => (
              <li key={d} className="flex items-center gap-2.5 rounded-lg border border-secondary px-4 py-2.5 text-sm text-secondary">
                <Check className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
                {d}
              </li>
            ))}
          </ul>
          {existing && existing.tier !== tier && (
            <Callout tone="warning" className="mt-4" title="The tier changes.">
              Saving moves {existing.name} from {TIER_META[existing.tier].label.toLowerCase()} to {meta.label.toLowerCase()} and resets its paperwork to 0%.
            </Callout>
          )}
          <p className="mt-4 text-xs text-quaternary">Guidance only, not legal advice.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-secondary pt-4">
        {step === 1 && !existing && (
          <Button
            color="link-gray"
            size="md"
            className="mr-auto"
            onPress={() => {
              if (!name.trim()) {
                setNameError('Give the tool a name so people can find it.');
                nameRef.current?.focus();
                return;
              }
              save(true);
            }}
          >
            Save as not assessed
          </Button>
        )}
        {step > 1 ? (
          <Button color="secondary" size="md" onPress={() => setStep((step - 1) as 1 | 2)}>
            Back
          </Button>
        ) : (
          <Button color="secondary" size="md" onPress={onDone}>
            Cancel
          </Button>
        )}
        {step < 3 ? (
          <Button color="primary" size="md" onPress={next}>
            Continue
          </Button>
        ) : (
          <Button color="primary" size="md" onPress={() => save()}>
            {existing ? 'Save reassessment' : 'Add to register'}
          </Button>
        )}
      </div>
    </div>
  );
}
