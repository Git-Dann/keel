'use client';

import type { ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { XClose } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/untitled/base/buttons/button';

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Prevent closing (for example while an upload is running). */
  locked?: boolean;
  /** Accessible role, alertdialog for confirmations. */
  role?: 'dialog' | 'alertdialog';
  className?: string;
}

function Header({ title, subtitle, onClose, locked }: Pick<BaseProps, 'title' | 'subtitle' | 'onClose' | 'locked'>) {
  return (
    <div className="flex items-start gap-3 border-b border-secondary px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <Heading slot="title" className="text-lg font-semibold break-words text-primary">
          {title}
        </Heading>
        {subtitle && <p className="mt-1 text-sm text-tertiary">{subtitle}</p>}
      </div>
      <Button color="tertiary" size="md" iconLeading={XClose} aria-label="Close" onPress={onClose} isDisabled={locked} className="-mt-1 -mr-2" />
    </div>
  );
}

/** Centred modal: wizards, confirmations, upload. Escape and backdrop close it, focus is trapped and restored. */
export function ModalDialog({ isOpen, onClose, title, subtitle, children, footer, locked, role = 'dialog', className }: BaseProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(o) => !o && !locked && onClose()}
      isDismissable={!locked}
      isKeyboardDismissDisabled={locked}
      className={({ isEntering, isExiting }) =>
        cx(
          'fixed inset-0 z-[100] flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[6px] sm:p-8',
          isEntering && 'animate-in fade-in duration-200',
          isExiting && 'animate-out fade-out duration-150',
        )
      }
    >
      <Modal
        className={({ isEntering }) =>
          cx('flex max-h-[calc(100dvh-32px)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl', isEntering && 'animate-in zoom-in-95 duration-200', className)
        }
      >
        <Dialog role={role} className="flex max-h-[inherit] min-h-0 flex-1 flex-col outline-hidden">
          <Header title={title} subtitle={subtitle} onClose={onClose} locked={locked} />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-secondary px-5 py-4 sm:px-6">{footer}</div>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Right-hand drawer for record detail. Max 560px, full width on phones, sticky footer. */
export function Drawer({ isOpen, onClose, title, subtitle, children, footer }: BaseProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(o) => !o && onClose()}
      isDismissable
      className={({ isEntering, isExiting }) =>
        cx(
          'fixed inset-0 z-[100] flex justify-end bg-overlay/70 backdrop-blur-[4px]',
          isEntering && 'animate-in fade-in duration-200',
          isExiting && 'animate-out fade-out duration-150',
        )
      }
    >
      <Modal
        className={({ isEntering, isExiting }) =>
          cx(
            'h-dvh w-full max-w-[560px] bg-primary shadow-xl',
            isEntering && 'animate-in slide-in-from-right duration-200',
            isExiting && 'animate-out slide-out-to-right duration-150',
          )
        }
      >
        <Dialog className="flex h-full flex-col outline-hidden">
          <Header title={title} subtitle={subtitle} onClose={onClose} />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-secondary bg-primary px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  destructive,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      role="alertdialog"
      footer={
        <>
          <Button color="secondary" size="md" onPress={onClose}>
            {cancelLabel}
          </Button>
          <Button color={destructive ? 'primary-destructive' : 'primary'} size="md" onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-md text-tertiary">{children}</div>
    </ModalDialog>
  );
}
