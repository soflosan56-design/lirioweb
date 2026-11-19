import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Type, X } from 'lucide-react';
import type { ArticleBlock } from '@/lib/types';
import { uploadImage } from '@/lib/api';

type BlocksEditorProps = {
  ownerId: string;
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
};

const MAX_BLOCK_TEXT = 4000;
const MAX_CAPTION = 200;

export default function BlocksEditor({ ownerId, blocks, onChange }: BlocksEditorProps) {
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<number>(Number.POSITIVE_INFINITY);

  function update(index: number, patch: Partial<ArticleBlock>) {
    onChange(blocks.map((block, i) => (i === index ? ({ ...block, ...patch } as ArticleBlock) : block)));
  }

  function addBlock(type: ArticleBlock['type']) {
    onChange([...blocks, makeBlock(type)]);
  }

  function makeBlock(type: ArticleBlock['type']): ArticleBlock {
    return type === 'image' ? { type, url: '', caption: '' } : { type, text: '' };
  }

  function insertBelow(index: number, type: 'subtitle') {
    const next = [...blocks];
    next.splice(index, 0, makeBlock(type));
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function openFilePicker(atIndex: number) {
    uploadTargetRef.current = atIndex;
    fileInputRef.current?.click();
  }

  async function handleFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const index = uploadTargetRef.current;
    setUploadingAt(index);
    try {
      const url = await uploadImage(ownerId, file);
      const fresh: ArticleBlock = { type: 'image', url, caption: '' };
      const next = [...blocks];
      next.splice(Math.min(index, next.length), 0, fresh);
      onChange(next);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingAt(null);
    }
  }

  return (
    <div className="rounded-none border-2 border-ink-900 bg-paper-50 p-4">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePicked} />

      <p className="field-label">Contenido del artículo</p>
      <p className="mb-3 text-xs text-ink-600">
        Añade subtítulos, párrafos y fotos en el orden que quieras. Usa las flechas para reordenar.
      </p>

      {blocks.length === 0 && (
        <p className="mb-3 border-2 border-dashed border-ink-900 p-4 text-center font-hand text-lg text-ink-600">
          El artículo está vacío. Empieza añadiendo un párrafo, un subtítulo o una foto.
        </p>
      )}

      <ul className="space-y-3">
        {blocks.map((block, index) => (
          <li key={index} className="border-2 border-ink-900 bg-white p-3 shadow-hard-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-display text-xs uppercase tracking-wider text-pink-700">
                {block.type === 'subtitle' ? 'Subtítulo' : block.type === 'image' ? 'Foto' : 'Párrafo'} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                {block.type === 'image' ? (
                  <button
                    type="button"
                    onClick={() => openFilePicker(index + 1)}
                    disabled={uploadingAt !== null}
                    title="Insertar foto debajo"
                    className="p-1.5 text-ink-700 hover:bg-neon-300 disabled:opacity-50"
                  >
                    {uploadingAt === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openFilePicker(index + 1)}
                      disabled={uploadingAt !== null}
                      title="Insertar foto debajo"
                      className="p-1.5 text-ink-700 hover:bg-neon-300 disabled:opacity-50"
                    >
                      {uploadingAt === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBelow(index, 'subtitle')}
                      title="Insertar subtítulo debajo"
                      className="p-1.5 text-ink-700 hover:bg-neon-300"
                    >
                      <Type className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => move(index, -1)} title="Subir" className="px-1.5 font-bold text-ink-700 hover:bg-neon-300">
                  ↑
                </button>
                <button type="button" onClick={() => move(index, 1)} title="Bajar" className="px-1.5 font-bold text-ink-700 hover:bg-neon-300">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  title="Quitar bloque"
                  className="p-1.5 text-pink-700 hover:bg-pink-100"
                >
                  {block.type === 'image' && block.url ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {block.type === 'image' ? (
              <div className="space-y-2">
                <img src={block.url} alt="" className="max-h-48 w-full border-2 border-ink-900 object-cover" />
                <input
                  className="field"
                  type="text"
                  placeholder="Pie de foto (opcional)"
                  value={block.caption}
                  maxLength={MAX_CAPTION}
                  onChange={(event) => update(index, { caption: event.target.value } as Partial<ArticleBlock>)}
                />
              </div>
            ) : (
              <textarea
                className={`field ${block.type === 'subtitle' ? 'min-h-[3rem] font-display uppercase' : 'min-h-[6rem]'}`}
                placeholder={block.type === 'subtitle' ? 'Texto del subtítulo' : 'Escribe aquí...'}
                value={block.text}
                maxLength={MAX_BLOCK_TEXT}
                onChange={(event) => update(index, { text: event.target.value } as Partial<ArticleBlock>)}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock('paragraph')}
          className="scrap-button bg-paper-50 px-3 py-2 text-sm text-ink-900 hover:bg-neon-300"
        >
          Párrafo
        </button>
        <button
          type="button"
          onClick={() => addBlock('subtitle')}
          className="scrap-button bg-paper-50 px-3 py-2 text-sm text-ink-900 hover:bg-neon-300"
        >
          <Type className="h-4 w-4" />
          Subtítulo
        </button>
        <button
          type="button"
          onClick={() => openFilePicker(blocks.length)}
          disabled={uploadingAt !== null}
          className="scrap-button bg-paper-50 px-3 py-2 text-sm text-ink-900 hover:bg-neon-300 disabled:opacity-60"
        >
          {uploadingAt === blocks.length ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Foto
        </button>
      </div>
    </div>
  );
}
