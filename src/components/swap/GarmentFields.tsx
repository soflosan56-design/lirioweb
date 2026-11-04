import { CONDITIONS, type GarmentFormValues } from '@/lib/garment';

type GarmentFieldsProps = {
  values: GarmentFormValues;
  onChange: (patch: Partial<GarmentFormValues>) => void;
};

export default function GarmentFields({ values, onChange }: GarmentFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label>
        <span className="field-label">Marca</span>
        <input className="field" value={values.brand} onChange={(e) => onChange({ brand: e.target.value })} maxLength={60} />
      </label>
      <label>
        <span className="field-label">Talla</span>
        <input className="field" value={values.size} onChange={(e) => onChange({ size: e.target.value })} maxLength={10} placeholder="M, 38, única..." />
      </label>
      <label>
        <span className="field-label">Estado</span>
        <select className="field" value={values.condition} onChange={(e) => onChange({ condition: e.target.value })}>
          {CONDITIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Material</span>
        <input className="field" value={values.material} onChange={(e) => onChange({ material: e.target.value })} maxLength={60} placeholder="Algodón, lana, cuero..." />
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">Descripción</span>
        <textarea
          className="field min-h-24"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          maxLength={600}
          placeholder="Cuenta cómo es, cuándo la usaste y cualquier detalle que importe."
        />
      </label>
    </div>
  );
}
