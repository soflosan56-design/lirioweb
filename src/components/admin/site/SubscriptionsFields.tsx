import type { SiteSettings } from '@/lib/types';

type Subscriptions = SiteSettings['subscriptions'];

type SubscriptionsFieldsProps = {
  value: Subscriptions;
  onChange: (subscriptions: Subscriptions) => void;
};

export default function SubscriptionsFields({ value, onChange }: SubscriptionsFieldsProps) {
  function updatePlan(index: number, patch: Partial<Subscriptions['plans'][number]>) {
    onChange({
      ...value,
      plans: value.plans.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    });
  }

  function updateFaq(index: number, patch: Partial<Subscriptions['faq'][number]>) {
    onChange({
      ...value,
      faq: value.faq.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5">
        <label className="block">
          <span className="field-label">Título</span>
          <input className="field" value={value.title} maxLength={60} onChange={(e) => onChange({ ...value, title: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">Introducción</span>
          <textarea className="field min-h-24" value={value.intro} maxLength={400} onChange={(e) => onChange({ ...value, intro: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">Nota destacada</span>
          <input className="field" value={value.note} maxLength={160} onChange={(e) => onChange({ ...value, note: e.target.value })} />
        </label>
      </div>

      <div className="space-y-4">
        <h4 className="font-display text-xl uppercase text-ink-900">Planes</h4>
        <div className="grid gap-5 md:grid-cols-3">
          {value.plans.map((plan, index) => (
            <div key={index} className="space-y-4 border-2 border-ink-900 bg-white p-4">
              <label className="block">
                <span className="field-label">Nombre</span>
                <input className="field" value={plan.name} maxLength={30} onChange={(e) => updatePlan(index, { name: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Precio</span>
                <input className="field" value={plan.price} maxLength={20} onChange={(e) => updatePlan(index, { price: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Periodo</span>
                <input className="field" value={plan.period} maxLength={30} onChange={(e) => updatePlan(index, { period: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Frase corta</span>
                <input className="field" value={plan.tagline} maxLength={100} onChange={(e) => updatePlan(index, { tagline: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Ventajas (una por línea)</span>
                <textarea
                  className="field min-h-32"
                  value={plan.features.join('\n')}
                  onChange={(e) => updatePlan(index, { features: e.target.value.split('\n') })}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-display text-xl uppercase text-ink-900">Preguntas frecuentes</h4>
        <div className="grid gap-5 md:grid-cols-2">
          {value.faq.map((item, index) => (
            <div key={index} className="space-y-4 border-2 border-ink-900 bg-white p-4">
              <label className="block">
                <span className="field-label">Pregunta</span>
                <input className="field" value={item.question} maxLength={120} onChange={(e) => updateFaq(index, { question: e.target.value })} />
              </label>
              <label className="block">
                <span className="field-label">Respuesta</span>
                <textarea className="field min-h-24" value={item.answer} maxLength={300} onChange={(e) => updateFaq(index, { answer: e.target.value })} />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
