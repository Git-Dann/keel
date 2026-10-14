'use client';

import { ConfirmDialog } from '@/components/ui/Overlay';
import { useKeel } from '@/lib/store';
import { toast, useOverlay } from '@/lib/ui-store';

export function ResetConfirm() {
  const open = useOverlay((s) => s.resetConfirmOpen);
  const setOverlay = useOverlay((s) => s.set);
  const reset = useKeel((s) => s.resetDemo);
  return (
    <ConfirmDialog
      isOpen={open}
      onClose={() => setOverlay({ resetConfirmOpen: false })}
      title="Reset the demo?"
      confirmLabel="Reset demo"
      destructive
      onConfirm={() => {
        reset();
        setOverlay({ resetConfirmOpen: false, resetCount: useOverlay.getState().resetCount + 1, wizard: null, uploadOpen: false });
        toast('Demo reset', 'Everything is back to the starting data, including tips and alerts.');
      }}
    >
      Every change you made in this browser goes back to the starting data. Dismissed tips and alerts come back too.
    </ConfirmDialog>
  );
}
