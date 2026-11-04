import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';
import { saveAdminRecord, type AdminRow } from '@/lib/adminApi';
import { toFormValues, toPayload, GALLERY_MAX_PHOTOS, type EntityConfig, type FieldDef, type FormValues } from '@/lib/adminEntities';

type RecordFormModalProps = {
  entity: EntityConfig;
  row: AdminRow | null;
  ownerId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function RecordFormModal({ entity, row, ownerId, onClose, onSaved }: RecordFormModalProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(entity.fields, row));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = row ? `Editar ${entity.noun}` : `Nuevo ${entity.noun}`;

  function setValue(name: string, value: FormValues[string]) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    let payload: Record<string, unknown>;
    try {
      payload = toPayload(entity.fields, values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revisa los datos del formulario.');
      return;
    }
    setSubmitting(true);
    try {
      await saveAdminRecord(entity.table, row?.id ?? null, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} maxWidthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {entity.fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            ownerId={ownerId}
            onChange={(value) => setValue(field.name, value)}
          />
        ))}

        {error && <p role="alert" className="text-sm font-bold text-pink-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="scrap-button bg-paper-50 px-5 py-3 text-lg text-ink-900 hover:bg-neon-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="scrap-button bg-yellow-500 px-5 py-3 text-lg text-ink-900 hover:bg-yellow-300 disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type FieldInputProps = {
  field: FieldDef;
  value: FormValues[string] | undefined;
  ownerId: string;
  onChange: (value: FormValues[string]) => void;
};

function FieldInput({ field, value, ownerId, onChange }: FieldInputProps) {
  const label = (
    <span className="field-label">
      {field.label}
      {field.required && ' *'}
    </span>
  );
  const text = typeof value === 'string' ? value : '';

  if (field.kind === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 border-2 border-ink-900 accent-pink-500"
        />
        <span className="font-display text-lg uppercase tracking-wide text-ink-900">{field.label}</span>
      </label>
    );
  }

  if (field.kind === 'images') {
    const urls = Array.isArray(value) ? value : [];
    return (
      <div className="block">
        {label}
        <ImageUploader
          ownerId={ownerId}
          max={GALLERY_MAX_PHOTOS}
          urls={urls}
          onChange={onChange}
        />
      </div>
    );
  }

  if (field.kind === 'image') {
    return (
      <div className="block">
        {label}
        <ImageUploader
          ownerId={ownerId}
          max={1}
          urls={text ? [text] : []}
          onChange={(urls) => onChange(urls[0] ?? '')}
        />
      </div>
    );
  }

  return (
    <label className="block">
      {label}
      {field.kind === 'textarea' && (
        <textarea
          className="field min-h-[7rem]"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={4000}
        />
      )}
      {field.kind === 'select' && (
        <select className="field" value={text} onChange={(event) => onChange(event.target.value)}>
          <option value="">Elige una opción</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {(field.kind === 'text' || field.kind === 'number' || field.kind === 'euros') && (
        <input
          className="field"
          type="text"
          inputMode={field.kind === 'text' ? 'text' : 'decimal'}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={field.kind === 'text' ? 200 : 12}
        />
      )}
      {field.hint && <span className="mt-1 block text-xs text-ink-600">{field.hint}</span>}
    </label>
  );
}
