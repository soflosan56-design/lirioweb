import type { ReactNode } from 'react';

type EditorSectionProps = {
  title: string;
  children: ReactNode;
};

export default function EditorSection({ title, children }: EditorSectionProps) {
  return (
    <section className="space-y-6 border-4 border-ink-900 bg-paper-50 p-5 shadow-hard sm:p-6">
      <h3 className="font-display text-3xl uppercase tracking-wide text-ink-900">{title}</h3>
      {children}
    </section>
  );
}
