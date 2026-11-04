import { useEffect, useState } from 'react';
import { ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import RecordFormModal from '@/components/admin/RecordFormModal';
import { deleteAdminRecord, fetchAdminRows, type AdminRow } from '@/lib/adminApi';
import type { EntityConfig } from '@/lib/adminEntities';

type AdminEntityPanelProps = {
  entity: EntityConfig;
  ownerId: string;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function AdminEntityPanel({ entity, ownerId, onNotify }: AdminEntityPanelProps) {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<AdminRow | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { table, select, orderBy, ascending } = entity;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminRows(table, select, orderBy, ascending)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [table, select, orderBy, ascending, version]);

  async function handleDelete(row: AdminRow) {
    const { title } = entity.describe(row);
    if (!window.confirm(`¿Borrar "${title}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(row.id);
    try {
      await deleteAdminRecord(table, row.id);
      onNotify('Registro borrado', 'success');
      setVersion((v) => v + 1);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo borrar el registro', 'error');
    } finally {
      setBusyId(null);
    }
  }

  function handleSaved() {
    setEditing(null);
    setVersion((v) => v + 1);
    onNotify('Cambios guardados', 'success');
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-bold text-ink-700">
          {loading ? 'Cargando...' : `${rows.length} ${rows.length === 1 ? entity.noun : `${entity.noun}s`}`}
        </p>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="scrap-button bg-pink-500 px-4 py-2.5 text-base text-ink-900 hover:bg-pink-300"
        >
          <Plus className="h-4 w-4" />
          Nuevo {entity.noun}
        </button>
      </div>

      {error && (
        <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-4 py-3 text-sm font-bold text-pink-900">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-ink-900" />
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="border-2 border-dashed border-ink-900 bg-paper-50 px-6 py-10 text-center font-hand text-xl text-ink-700">
          Todavía no hay {entity.noun}s. Crea el primero.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((row) => {
            const { title, meta, image } = entity.describe(row);
            const busy = busyId === row.id;
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-4 border-2 border-ink-900 bg-paper-50 p-3 shadow-hard-sm"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden border-2 border-ink-900 bg-yellow-100">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-ink-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase tracking-wide text-ink-900">{title}</p>
                  <p className="truncate text-sm text-ink-700">{meta}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    disabled={busy}
                    className="scrap-button bg-paper-50 px-3 py-2 text-sm text-ink-900 hover:bg-neon-300 disabled:opacity-60"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    disabled={busy}
                    className="scrap-button bg-paper-50 px-3 py-2 text-sm text-pink-900 hover:bg-pink-100 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <RecordFormModal
          entity={entity}
          row={editing === 'new' ? null : editing}
          ownerId={ownerId}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}
