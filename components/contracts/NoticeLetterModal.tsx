'use client';

import { useState } from 'react';
import { Copy01 } from '@untitledui/icons';
import { Button } from '@/components/ui/untitled/base/buttons/button';
import { ModalDialog } from '@/components/ui/Overlay';
import { Callout } from '@/components/ui/Primitives';
import { noticeLetter } from '@/lib/logic/contracts';
import { copyText } from '@/lib/actions';
import { useKeel } from '@/lib/store';
import type { Contract } from '@/lib/types';

export function NoticeLetterModal({ contract, isOpen, onClose }: { contract: Contract; isOpen: boolean; onClose: () => void }) {
  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Notice letter" subtitle="Edit it, then paste it onto your letterhead">
      {isOpen && <LetterBody key={contract.id} contract={contract} onDone={onClose} />}
    </ModalDialog>
  );
}

function LetterBody({ contract, onDone }: { contract: Contract; onDone: () => void }) {
  const [text, setText] = useState(() => noticeLetter(contract));
  const log = useKeel((s) => s.log);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="notice-letter" className="mb-1.5 block text-sm font-medium text-secondary">
          Letter to {contract.party}
        </label>
        <textarea
          id="notice-letter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full resize-y rounded-lg bg-primary px-3.5 py-3 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:ring-2 focus:ring-brand focus:outline-hidden"
        />
      </div>
      <Callout tone="info" title="Check how notice must be served.">
        Some contracts need notice by post, some by email, some both. The clause will say.
      </Callout>
      <div className="flex flex-wrap justify-end gap-3">
        <Button color="secondary" size="md" onPress={onDone}>
          Cancel
        </Button>
        <Button
          color="primary"
          size="md"
          iconLeading={Copy01}
          onPress={async () => {
            if (await copyText(text, 'Letter copied')) {
              log('Contracts', `Notice letter drafted for ${contract.name}`);
              onDone();
            }
          }}
        >
          Copy letter
        </Button>
      </div>
    </div>
  );
}
