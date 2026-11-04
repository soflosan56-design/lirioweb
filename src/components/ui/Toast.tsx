import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export type ToastState = { id: number; message: string; tone: 'success' | 'error' };

type ToastProps = {
  toast: ToastState | null;
  onDismiss: () => void;
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.tone === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 border-2 border-ink-900 px-5 py-3 font-display text-lg uppercase tracking-wide text-ink-900 shadow-hard animate-pop-in ${
        isSuccess ? 'bg-neon-500' : 'bg-pink-500'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}
