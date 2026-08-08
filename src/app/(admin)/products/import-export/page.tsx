"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Users,
  X,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  imported: number;
  errors: { line: number; message: string }[];
}

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportExportPage() {
  const { toast } = useToast();

  // ── Export ───────────────────────────────────────────────────────────────────
  const [exportingProducts, setExportingProducts] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);

  async function handleExport(
    endpoint: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) {
    setLoading(true);
    try {
      const { data } = await axiosClient.get<Blob>(endpoint, {
        responseType: "blob",
      });
      downloadBlob(data, filename);
      toast({ title: "Export prêt", description: `${filename} téléchargé.` });
    } catch (err: any) {
      handleApiError(err, "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  }

  // ── Import ───────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setResult(null);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axiosClient.post<ImportResult>(
        "/v1/import/products",
        formData
      );
      setResult(data);
    } catch (err: any) {
      handleApiError(err, "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Import / Export"
        sousTitre="Gérez votre catalogue en masse via des fichiers CSV"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Import ── */}
        <SectionCard title="Importer des produits">
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files[0]);
              }}
              className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center transition ${
                dragging
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : file
                  ? "border-primary/40 bg-primary-soft/50 text-primary-dark"
                  : "border-slate-300 bg-slate-50 text-slate-400 hover:border-primary/50 hover:text-primary-dark"
              }`}
            >
              <FileUp className="h-8 w-8" />
              {file ? (
                <>
                  <span className="text-sm font-semibold">{file.name}</span>
                  <span className="text-xs">
                    {(file.size / 1024).toFixed(1)} Ko
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold">
                    Déposer un fichier CSV ou cliquer
                  </span>
                  <span className="text-xs">
                    Colonnes : nom, slug, sku, prix, stock, catégorie
                  </span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            {/* Actions */}
            {file && !result && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={importing}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <X className="h-4 w-4" /> Annuler
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                  {importing ? "Import en cours…" : "Lancer l'import"}
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {result.imported} produit(s) importé(s) avec succès
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {result.errors.length} ligne(s) ignorée(s)
                    </p>
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {result.errors.map((e) => (
                        <li
                          key={e.line}
                          className="flex gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-xs text-danger"
                        >
                          <span className="shrink-0 font-bold">Ligne {e.line}</span>
                          <span>{e.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Importer un autre fichier
                </button>
              </div>
            )}

            {/* Template hint */}
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              Format attendu : nom, slug, sku, prix, stock, catégorie (en-têtes obligatoires)
            </p>
          </div>
        </SectionCard>

        {/* ── Export ── */}
        <SectionCard title="Exporter des données">
          <div className="space-y-3">
            {/* Products */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  Catalogue produits
                </p>
                <p className="text-xs text-slate-400">
                  Nom, slug, SKU, prix, stock, catégorie, statut
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleExport(
                    "/v1/export/products",
                    "produits.csv",
                    setExportingProducts
                  )
                }
                disabled={exportingProducts}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-semibold text-secondary transition hover:bg-slate-50 disabled:opacity-40"
              >
                {exportingProducts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                CSV
              </button>
            </div>

            {/* Users */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  Utilisateurs
                </p>
                <p className="text-xs text-slate-400">
                  Nom, email, téléphone, rôle, statut, date d&apos;inscription
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleExport(
                    "/export/users",
                    "utilisateurs.csv",
                    setExportingUsers
                  )
                }
                disabled={exportingUsers}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-semibold text-secondary transition hover:bg-slate-50 disabled:opacity-40"
              >
                {exportingUsers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                CSV
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
