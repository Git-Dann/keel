'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, UploadCloud02 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { ModalDialog } from '@/components/ui/Overlay';
import { Spinner } from '@/components/ui/Primitives';
import { newId, useKeel } from '@/lib/store';
import { toast, useOverlay } from '@/lib/ui-store';
import { extractedContract, isDuplicateName, nameFromFile, SAMPLE_CONTRACT, validateUpload } from '@/lib/logic/contracts';

const STEPS = ['Reading the document', 'Finding parties and dates', 'Extracting obligations and penalties', 'Checking notice periods'];
const STEP_MS = 650;

export function UploadModal() {
  const open = useOverlay((s) => s.uploadOpen);
  const sample = useOverlay((s) => s.uploadSample);
  const setOverlay = useOverlay((s) => s.set);
  const close = () => setOverlay({ uploadOpen: false, uploadSample: false });
  return (
    <ModalDialog isOpen={open} onClose={close} title="Upload a contract" subtitle="PDF or Word, up to 25 MB">
      {open && <UploadBody startWithSample={sample} onClose={close} />}
    </ModalDialog>
  );
}

function UploadBody({ startWithSample, onClose }: { startWithSample: boolean; onClose: () => void }) {
  const router = useRouter();
  const addContract = useKeel((s) => s.addContract);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [fileName, setFileName] = useState('');

  const extract = useCallback(
    (name: string, party: string, label: string) => {
      setError('');
      setFileName(label);
      setStep(0);
      STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i + 1), STEP_MS * (i + 1))));
      timers.current.push(
        setTimeout(() => {
          finished.current = true;
          const contracts = useKeel.getState().data.contracts;
          if (isDuplicateName(contracts, name))
            toast('Possible duplicate', `You already have a contract called "${name}". Keel added this one too, so check which is current.`, 'warning');
          const c = extractedContract(newId('c'), name, party);
          addContract(c);
          toast('Contract added', `${name}: notice deadline found. One term needs checking.`);
          onClose();
          router.push(`/contracts?open=${c.id}`);
        }, STEP_MS * (STEPS.length + 1)),
      );
    },
    [addContract, onClose, router],
  );

  // Cancelling mid-way (close button, Escape, backdrop) stops the extraction.
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      if (!finished.current && list.length) toast('Upload cancelled', 'Nothing was added.', 'warning');
    };
  }, []);

  useEffect(() => {
    if (!startWithSample) return;
    const t = setTimeout(() => extract(SAMPLE_CONTRACT.name, SAMPLE_CONTRACT.party, 'Sample: telephony-services-agreement.pdf'), 0);
    return () => clearTimeout(t);
  }, [startWithSample, extract]);

  const handle = (f: File | undefined | null) => {
    if (!f) return;
    const err = validateUpload(f);
    if (err) {
      setError(err);
      return;
    }
    extract(nameFromFile(f.name), 'Counterparty to confirm', f.name);
  };

  const busy = step !== null;

  return (
    <div className="flex flex-col gap-4">
      {!busy ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-describedby="drop-hint upload-error"
            aria-label="Choose a contract file to upload"
            onClick={() => input.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                input.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              handle(e.dataTransfer.files?.[0]);
            }}
            className={cx(
              'flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-primary bg-primary px-6 py-8 text-center transition-colors hover:border-brand hover:bg-utility-brand-50',
              over && 'border-brand bg-utility-brand-50',
              error && 'border-error',
            )}
          >
            <span className="mb-3 grid size-10 place-items-center rounded-lg border border-secondary bg-primary text-fg-tertiary shadow-xs" aria-hidden>
              <UploadCloud02 className="size-5" />
            </span>
            <p className="text-sm text-tertiary">
              <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
            </p>
            <p id="drop-hint" className="mt-1 text-xs text-quaternary">
              PDF, DOC or DOCX up to 25 MB. Nothing leaves your browser in this demo.
            </p>
            <input
              ref={input}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                handle(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <p id="upload-error" role="alert" className={cx('text-sm text-error-primary', !error && 'sr-only')}>
            {error}
          </p>
        </>
      ) : (
        <div>
          <p className="mb-3 truncate text-sm font-medium text-secondary" title={fileName}>
            {fileName}
          </p>
          <ol className="flex flex-col gap-3" aria-label="Extraction progress">
            {STEPS.map((s, i) => {
              const done = step > i;
              const now = step === i;
              return (
                <li key={s} className={cx('flex items-center gap-3 text-sm', done ? 'text-secondary' : now ? 'text-primary' : 'text-quaternary')}>
                  <span
                    className={cx(
                      'grid size-6 shrink-0 place-items-center rounded-full border',
                      done ? 'border-transparent bg-brand-solid text-white' : now ? 'border-transparent text-fg-brand-primary' : 'border-primary',
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="size-3.5" /> : now ? <Spinner className="size-5" /> : null}
                  </span>
                  {s}
                  <span className="sr-only">{done ? ', done' : now ? ', in progress' : ''}</span>
                </li>
              );
            })}
          </ol>
          <p className="sr-only" aria-live="polite">
            {step !== null && step < STEPS.length ? STEPS[step] : 'Finishing up'}
          </p>
          <p className="mt-4 text-xs text-quaternary">Close this window to cancel. Nothing is added until the last step finishes.</p>
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-secondary pt-4">
        <Button color="secondary" size="md" onPress={onClose} isDisabled={busy}>
          Cancel
        </Button>
        <Button color="secondary" size="md" isDisabled={busy} onPress={() => extract(SAMPLE_CONTRACT.name, SAMPLE_CONTRACT.party, 'Sample: telephony-services-agreement.pdf')}>
          Use a sample instead
        </Button>
      </div>
    </div>
  );
}
