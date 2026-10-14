'use client';

import { UploadModal } from '@/components/contracts/UploadModal';
import { AiWizard } from '@/components/ai/AiWizard';

/** Modals that can be opened from anywhere: the palette, Home and page actions. */
export function GlobalModals() {
  return (
    <>
      <UploadModal />
      <AiWizard />
    </>
  );
}
