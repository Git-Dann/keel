'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle, Home02, PresentationChart01 } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { Card } from '@/components/ui/Primitives';
import { HelpTip } from '@/components/ui/HelpTip';
import { BoatMark } from '@/components/shell/Logo';
import { MODULES, MODULE_ORDER } from '@/lib/modules';
import type { ModuleId } from '@/lib/types';

const WHAT: Record<ModuleId, string> = {
  contracts: 'Finds renewal dates, notice periods and penalties, and warns before the window closes.',
  ai: 'Lists every AI tool, sorts it into an EU AI Act tier and tracks the paperwork.',
  tribunal: 'Checks a dismissal or grievance against the process a tribunal expects, before the decision.',
  accounts: 'One-page prospect briefings from filings, news and hiring signals.',
  board: 'Drafts the monthly board pack from finance, sales, delivery and people tools.',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mb-10">
      <h2 id={id} className="mb-4 font-head text-[30px] leading-tight text-primary sm:text-[36px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Point({ title, children, dot }: { title: string; children: ReactNode; dot?: string }) {
  return (
    <li className="flex gap-3 px-5 py-4">
      {dot ? <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', dot)} aria-hidden /> : <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-tertiary">{children}</p>
      </div>
    </li>
  );
}

function Slider({ id, label, help, min, max, step, value, onChange, format }: {
  id: string; label: string; help: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void; format: (n: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1">
          <label htmlFor={id} className="text-sm font-medium text-secondary">
            {label}
          </label>
          <HelpTip text={help} label={`About ${label.toLowerCase()}`} />
        </span>
        <output htmlFor={id} className="text-sm font-semibold text-primary tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format(value)}
        className="h-10 w-full cursor-pointer accent-[var(--color-brand-600)]"
      />
      <div className="flex justify-between text-xs text-quaternary" aria-hidden>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

export function PitchPage() {
  const [customers, setCustomers] = useState(40);
  const [price, setPrice] = useState(1500);
  const arr = customers * price * 12;

  return (
    <article>
      <header className="relative mb-10 overflow-hidden rounded-2xl bg-brand-700 px-6 py-10 text-white sm:px-10 sm:py-14">
        <BoatMark tile={false} className="pointer-events-none absolute -right-12 -bottom-20 size-56 opacity-10 sm:-bottom-16 sm:size-96 sm:opacity-15" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          <PresentationChart01 className="size-4" aria-hidden />A one-page case for Harry
        </span>
        <h1 className="relative mt-5 max-w-[16ch] font-head text-[40px] leading-[1.02] sm:text-[64px]">Five quiet problems. One platform that watches them.</h1>
        <p className="relative mt-5 max-w-[58ch] text-lg text-white/95">
          Growing companies lose money in the gaps: a contract that rolls over, an AI tool that is now regulated, a dismissal handled badly, a sales call made cold, a board pack that eats a week. Keel watches all five in one place.
        </p>
      </header>

      <Section title="What it is">
        <ul className="grid gap-4 sm:grid-cols-2 split:grid-cols-5">
          {MODULE_ORDER.map((id) => {
            const m = MODULES[id];
            return (
              <li key={id}>
                <Link href={m.href} className="flex h-full flex-col rounded-xl border border-secondary bg-primary p-5 shadow-xs transition-colors hover:border-primary">
                  <span className={cx('mb-3 grid size-9 place-items-center rounded-lg text-white', m.bg)} aria-hidden>
                    <m.Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-primary">{m.label}</span>
                  <span className="mt-1 text-sm text-tertiary">{WHAT[id]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Why one platform beats five tools">
        <Card>
          <ul className="divide-y divide-secondary">
            <Point title="One horizon" dot="bg-module-contracts">
              Every deadline across legal, HR, compliance, sales and the board sits on one timeline. Five separate tools can never show that.
            </Point>
            <Point title="Shared data" dot="bg-module-ai">
              The board pack&rsquo;s risk section writes itself from the other four tools. Each module makes the others more useful.
            </Point>
            <Point title="One buyer" dot="bg-module-board">
              The COO or head of operations at a 50 to 500 person company owns all five problems, and runs them in spreadsheets today.
            </Point>
          </ul>
        </Card>
      </Section>

      <Section title="The money">
        <Card className="p-5 sm:p-8">
          <div className="grid items-center gap-8 split:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Slider
                id="calc-customers"
                label="Paying customers"
                help="Assumption. Start with five design partners and aim for 40 within 18 months."
                min={5}
                max={300}
                step={5}
                value={customers}
                onChange={setCustomers}
                format={(n) => String(n)}
              />
              <Slider
                id="calc-price"
                label="Average monthly price"
                help="Assumption. Around £600 a month for two tools, around £1,500 for all five. To be tested with design partners."
                min={300}
                max={4000}
                step={100}
                value={price}
                onChange={setPrice}
                format={gbp}
              />
            </div>
            <div className="rounded-xl bg-secondary p-6 text-center">
              <p className="flex items-center justify-center gap-1 text-sm font-medium text-tertiary">
                Annual recurring revenue
                <HelpTip text="Assumption. Customers times monthly price times 12. No churn, discounts or expansion included." label="About this figure" />
              </p>
              <p className="mt-2 font-head text-[48px] leading-none break-all text-brand-secondary sm:text-[72px]" aria-live="polite">
                {gbp(arr)}
              </p>
              <p className="mt-2 text-sm text-tertiary">
                {customers} customers at {gbp(price)} a month
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-quaternary">All figures are assumptions for discussion, not research. We would validate pricing with the first five customers.</p>
        </Card>
      </Section>

      <Section title="Why Gitwork can build it">
        <Card>
          <ul className="divide-y divide-secondary">
            <Point title="We already build this for clients">Document extraction, dashboards and workflow tools are what we ship every week.</Point>
            <Point title="Foundry proves we can run our own product">We run our own agency on a platform we built. Keel uses the same shell, tray and patterns.</Point>
            <Point title="The front end is done">This demo is the product&rsquo;s face. The real work is the extraction engine, integrations and security.</Point>
          </ul>
        </Card>
      </Section>

      <Section title="Honest risks">
        <Card>
          <ul className="divide-y divide-secondary">
            <Point title="Legal liability" dot="bg-fg-error-secondary">
              Contracts, AI Act and tribunal outputs must stay guidance. We would partner with a law firm to review the rules and take referrals.
            </Point>
            <Point title="Account research is crowded" dot="bg-fg-warning-secondary">
              Plenty of sales tools do this already. It could be cut, or kept as a small add-on.
            </Point>
            <Point title="The security bar is high" dot="bg-fg-warning-secondary">
              Customers will upload contracts and HR data. Expect security questionnaires first, then a formal certification.
            </Point>
            <Point title="Focus" dot="bg-fg-warning-secondary">
              A product competes with client work for the same people. It needs ring-fenced time away from client projects.
            </Point>
          </ul>
        </Card>
      </Section>

      <Section title="The ask">
        <Card className="p-5 sm:p-8">
          <p className="max-w-[64ch] text-lg text-secondary">
            Six weeks, two developers and me, to take <strong className="font-semibold text-primary">Contracts</strong> from demo to a working product with five paying design partners. If three of the five renew, we build the next module. If not, we stop and keep what we learned.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contracts" color="primary" size="lg" iconTrailing={ArrowRight}>
              See Contracts
            </Button>
            <Button href="/" color="secondary" size="lg" iconLeading={Home02}>
              Back to Home
            </Button>
          </div>
        </Card>
      </Section>
    </article>
  );
}
