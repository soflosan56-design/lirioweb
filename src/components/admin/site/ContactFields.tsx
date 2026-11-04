import type { SiteSettings } from '@/lib/types';

type Contact = SiteSettings['contact'];

type ContactFieldsProps = {
  value: Contact;
  onChange: (contact: Contact) => void;
};

export default function ContactFields({ value, onChange }: ContactFieldsProps) {
  return (
    <div className="grid gap-5">
      <label className="block">
        <span className="field-label">Título</span>
        <input className="field" value={value.title} maxLength={40} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </label>
      <label className="block">
        <span className="field-label">Texto de introducción</span>
        <textarea className="field min-h-24" value={value.intro} maxLength={300} onChange={(e) => onChange({ ...value, intro: e.target.value })} />
      </label>
      <label className="block">
        <span className="field-label">Email de contacto</span>
        <input className="field" type="email" value={value.email} maxLength={120} onChange={(e) => onChange({ ...value, email: e.target.value })} />
      </label>
    </div>
  );
}
