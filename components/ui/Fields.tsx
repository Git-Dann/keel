'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { HelpTip } from './HelpTip';

/*
 * Form fields styled to the Untitled UI input spec (40px, ring-primary, brand focus ring,
 * error ring and hint). Kept as plain inputs so a help icon can sit next to every label.
 */

const control =
  'h-10 w-full rounded-lg bg-primary px-3 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-hidden disabled:cursor-not-allowed disabled:bg-secondary disabled:text-tertiary';
const invalid = 'ring-error_subtle focus:ring-error';

export function FieldLabel({ htmlFor, children, help, id }: { htmlFor?: string; children: ReactNode; help?: string; id?: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1">
      <label htmlFor={htmlFor} id={id} className="text-sm font-medium text-secondary">
        {children}
      </label>
      {help && <HelpTip text={help} label={`About ${typeof children === 'string' ? children.toLowerCase() : 'this field'}`} />}
    </div>
  );
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  if (error)
    return (
      <p id={id} className="mt-1.5 text-sm text-error-primary">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={id} className="mt-1.5 text-sm text-tertiary">
        {hint}
      </p>
    );
  return null;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  help?: string;
  hint?: ReactNode;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, help, hint, error, id, className, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  const mid = `${fid}-msg`;
  return (
    <div className={className}>
      <FieldLabel htmlFor={fid} help={help}>
        {label}
      </FieldLabel>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error || hint ? mid : undefined}
        className={cx(control, error && invalid)}
        {...rest}
      />
      <FieldMessage id={mid} error={error} hint={hint} />
    </div>
  );
});

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  help?: string;
  hint?: ReactNode;
  options: { value: string; label: string }[];
  hideLabel?: boolean;
}

export function SelectField({ label, help, hint, options, id, className, hideLabel, ...rest }: SelectFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const mid = `${fid}-msg`;
  return (
    <div className={className}>
      {hideLabel ? (
        <label htmlFor={fid} className="sr-only">
          {label}
        </label>
      ) : (
        <FieldLabel htmlFor={fid} help={help}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        <select id={fid} aria-describedby={hint ? mid : undefined} className={cx(control, 'appearance-none pr-10 font-medium')} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-quaternary" aria-hidden />
      </div>
      <FieldMessage id={mid} hint={hint} />
    </div>
  );
}
