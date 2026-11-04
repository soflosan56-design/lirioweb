import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';
import { sendContactMessage } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactForm = { name: string; email: string; subject: string; message: string };
const EMPTY_FORM: ContactForm = { name: '', email: '', subject: '', message: '' };

type ContactPageProps = {
  content: SiteSettings['contact'];
};

export default function ContactPage({ content }: ContactPageProps) {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };
    if (!input.name || !input.subject || !input.message) return setError('Completa nombre, asunto y mensaje.');
    if (!EMAIL_PATTERN.test(input.email)) return setError('Escribe un email válido.');
    setSubmitting(true);
    setError(null);
    try {
      await sendContactMessage(input);
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-12">
      <aside className="relative lg:col-span-5">
        <span className="sticker-label -rotate-2 bg-pink-500 text-ink-900">Contacto</span>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-7xl">
          {content.title}<span className="text-pink-500">.</span>
        </h1>
        <p className="mt-6 text-lg text-ink-800">{content.intro}</p>
        <div className="mt-8 flex -rotate-1 items-center gap-3 border-2 border-ink-900 bg-white p-4 shadow-hard-sm">
          <Mail className="h-6 w-6 shrink-0" />
          <p className="font-bold">{content.email}</p>
        </div>
        <span className="tape -right-4 -top-4 rotate-6" />
      </aside>

      <section className="relative border-4 border-ink-900 bg-paper-50 p-6 shadow-hard-pink sm:p-8 lg:col-span-7">
        {sent ? (
          <div role="status" className="flex flex-col items-start gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-pink-600" />
            <h2 className="font-display text-4xl uppercase">Mensaje enviado</h2>
            <p className="text-lg text-ink-800">Gracias por escribir. Te responderemos en cuanto podamos.</p>
            <button type="button" onClick={() => setSent(false)} className="scrap-button bg-yellow-500 px-5 py-2.5 text-lg text-ink-900">
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
            <label>
              <span className="field-label">Nombre</span>
              <input className="field" value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={80} />
            </label>
            <label>
              <span className="field-label">Email</span>
              <input className="field" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} maxLength={120} />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Asunto</span>
              <input className="field" value={form.subject} onChange={(e) => update('subject', e.target.value)} maxLength={120} />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Mensaje</span>
              <textarea className="field min-h-36 resize-y" value={form.message} onChange={(e) => update('message', e.target.value)} maxLength={2000} />
            </label>
            {error && (
              <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-900 sm:col-span-2">
                {error}
              </p>
            )}
            <div className="sm:col-span-2 sm:flex sm:justify-end">
              <button type="submit" disabled={submitting} className="scrap-button w-full bg-pink-500 px-6 py-3 text-xl text-ink-900 hover:bg-pink-300 sm:w-auto">
                <Send className="h-5 w-5" /> {submitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
