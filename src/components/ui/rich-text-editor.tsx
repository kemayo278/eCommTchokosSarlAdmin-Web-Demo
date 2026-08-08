'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Table as TableIcon,
  Undo,
  Redo,
  Trash2,
  Columns,
} from 'lucide-react';

interface ActiveStates {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

export default function RichTextEditor({
  value = '',
  onChange,
  label,
  error,
  placeholder = 'Écrivez votre contenu…',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveStates>({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [hasTable, setHasTable] = useState(false);
  const [columns, setColumns] = useState(3);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Set initial HTML content once on mount
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateActiveStates = () => {
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const handleInput = () => {
    updateActiveStates();
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const exec = (command: string, val: string | null = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val ?? undefined);
    updateActiveStates();
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const insertTable = (colCount = columns) => {
    const headerCells = Array.from({ length: colCount }, (_, i) =>
      `<td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:600;">En-tête ${i + 1}</td>`
    ).join('');
    const dataCells = Array.from({ length: colCount }, () =>
      `<td style="border:1px solid #d1d5db;padding:8px;">&nbsp;</td>`
    ).join('');
    const table = `<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody><tr>${headerCells}</tr><tr>${dataCells}</tr><tr>${dataCells}</tr></tbody></table>`;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, table);
    setHasTable(true);
    setShowColumnPicker(false);
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const removeTable = () => {
    editorRef.current?.querySelectorAll('table').forEach((t) => t.remove());
    setHasTable(false);
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const btnClass = (isActive: boolean) =>
    `p-2 rounded-md transition-colors ${
      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== el.innerHTML) {
      el.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      {label && (
        <span className="text-sm font-semibold text-secondary">{label}</span>
      )}
      <div
        className={`border rounded-lg overflow-hidden bg-white shadow-sm ${
          error ? 'border-danger' : 'border-gray-200'
        }`}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
          <button type="button" onClick={() => exec('bold')} className={btnClass(active.bold)} title="Gras">
            <Bold size={16} />
          </button>
          <button type="button" onClick={() => exec('italic')} className={btnClass(active.italic)} title="Italique">
            <Italic size={16} />
          </button>
          <button type="button" onClick={() => exec('underline')} className={btnClass(active.underline)} title="Souligné">
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass(active.insertUnorderedList)} title="Liste à puces">
            <List size={16} />
          </button>
          <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass(active.insertOrderedList)} title="Liste numérotée">
            <ListOrdered size={16} />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnPicker((v) => !v)}
              className={btnClass(hasTable)}
              title="Insérer un tableau"
            >
              <TableIcon size={16} />
            </button>
            {showColumnPicker && (
              <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border border-gray-200 bg-white shadow-lg p-3 min-w-45">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Columns size={12} /> Nombre de colonnes
                </p>
                <div className="flex gap-1">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setColumns(n); insertTable(n); }}
                      className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors ${
                        columns === n ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {hasTable && (
            <button type="button" onClick={removeTable} className="p-2 rounded-md text-red-500 hover:bg-red-50" title="Supprimer le tableau">
              <Trash2 size={16} />
            </button>
          )}

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <button type="button" onClick={() => exec('undo')} className={btnClass(false)} title="Annuler">
            <Undo size={16} />
          </button>
          <button type="button" onClick={() => exec('redo')} className={btnClass(false)} title="Rétablir">
            <Redo size={16} />
          </button>
        </div>

        {/* Zone d'édition */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyUp={handleInput}
          onMouseUp={updateActiveStates}
          onInput={handleInput}
          className="prose prose-sm max-w-none min-h-36 px-4 py-3 focus:outline-none text-gray-800"
          data-placeholder={placeholder}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
