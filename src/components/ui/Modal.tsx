import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
};

export default function Modal({ title, onClose, children, maxWidthClass = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto border-4 border-ink-900 bg-paper-50 shadow-[10px_10px_0_0_#FF2E93]`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b-4 border-ink-900 bg-neon-500 px-5 py-3">
          <h2 className="font-display text-2xl uppercase tracking-wide text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-paper-50 transition-transform hover:rotate-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
