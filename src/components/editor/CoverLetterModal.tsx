"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Loader2,
  FileText,
  Download,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

interface CoverLetterItem {
  id: string;
  job_title: string;
  job_offer: string;
  content: string;
  created_at: string;
}

interface CoverLetterModalProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CoverLetterModal({
  resumeId,
  isOpen,
  onClose,
}: CoverLetterModalProps) {
  const router = useRouter();

  const [allowance, setAllowance] = useState<number>(0);
  const [letters, setLetters] = useState<CoverLetterItem[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<CoverLetterItem | null>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [jobOffer, setJobOffer] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "view">("generate");

  const fetchCoverLetters = useCallback(async () => {
    if (!resumeId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/resumes/${resumeId}/cover-letter`);
      if (res.ok) {
        const data = await res.json();
        setAllowance(data.cover_letter_allowance || 0);
        setLetters(data.cover_letters || []);

        if (data.cover_letters && data.cover_letters.length > 0) {
          const latest = data.cover_letters[0];
          setSelectedLetter(latest);
          setEditedContent(latest.content);
        } else {
          setActiveTab("generate");
        }
      }
    } catch (err) {
      console.error("Error fetching cover letters:", err);
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    if (isOpen) {
      fetchCoverLetters();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, fetchCoverLetters]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!jobTitle.trim() || !jobOffer.trim()) {
      setErrorMsg("Veuillez remplir le titre du poste et l'offre d'emploi.");
      return;
    }

    if (allowance <= 0) {
      setErrorMsg("Crédits insuffisants. Vous devez débloquer des crédits pour ce CV.");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch(`/api/resumes/${resumeId}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          job_offer: jobOffer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la génération de la lettre.");
      }

      setAllowance(data.cover_letter_allowance ?? (allowance - 1));
      const newLetter = data.cover_letter;
      setLetters((prev) => [newLetter, ...prev]);
      setSelectedLetter(newLetter);
      setEditedContent(newLetter.content);
      setActiveTab("view");
      setSuccessMsg("Lettre de motivation générée avec succès par l'IA !");
    } catch (err: any) {
      console.error("Generate error:", err);
      setErrorMsg(err.message || "Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedLetter) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/cover-letters/${selectedLetter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la sauvegarde.");
      }

      setLetters((prev) =>
        prev.map((l) => (l.id === selectedLetter.id ? { ...l, content: editedContent } : l))
      );
      setSelectedLetter((prev) => (prev ? { ...prev, content: editedContent } : null));
      setSuccessMsg("Modifications enregistrées avec succès !");
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedLetter) return;
    try {
      setExportingPdf(true);
      setErrorMsg(null);

      const res = await fetch(`/api/cover-letters/${selectedLetter.id}/export`, {
        method: "GET",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'exportation du PDF.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (selectedLetter.job_title || "Lettre").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Lettre_${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export PDF error:", err);
      setErrorMsg(err.message || "Erreur lors de l'exportation en PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette lettre de motivation ?")) return;
    try {
      const res = await fetch(`/api/cover-letters/${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = letters.filter((l) => l.id !== id);
        setLetters(updated);
        if (selectedLetter?.id === id) {
          if (updated.length > 0) {
            setSelectedLetter(updated[0]);
            setEditedContent(updated[0].content);
          } else {
            setSelectedLetter(null);
            setEditedContent("");
            setActiveTab("generate");
          }
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Lettre de Motivation IA
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Rédigée sur mesure par Anthropic Claude 3.5 Sonnet d&apos;après votre CV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Allowance Badge */}
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{allowance} disponible{allowance > 1 ? "s" : ""}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs / Subheader */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "generate"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Générer une nouvelle lettre</span>
            </button>

            <button
              onClick={() => {
                if (letters.length > 0) setActiveTab("view");
              }}
              disabled={letters.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "view"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-40"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mes Lettres générées ({letters.length})</span>
            </button>
          </div>

          {allowance <= 0 && (
            <button
              onClick={() => {
                onClose();
                router.push("/pricing");
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 underline underline-offset-4"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Acheter des crédits</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
              <p className="text-sm">Chargement des lettres de motivation...</p>
            </div>
          ) : activeTab === "generate" ? (
            /* TAB 1: GENERATE FORM */
            <form onSubmit={handleGenerate} className="space-y-5 max-w-2xl mx-auto py-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Intitulé du Poste Cible *
                </label>
                <input
                  type="text"
                  placeholder="ex: Développeur Full Stack Senior, Chef de Projet Digital..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Texte ou Description de l&apos;Offre d&apos;Emploi *
                </label>
                <textarea
                  rows={7}
                  placeholder="Collez ici le texte complet de l'offre d'emploi (exigences, compétences recherchées, responsabilités)..."
                  value={jobOffer}
                  onChange={(e) => setJobOffer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generating || allowance <= 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rédaction par l&apos;IA Anthropic en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Générer la lettre de motivation IA (1 crédit)</span>
                    </>
                  )}
                </button>

                {allowance <= 0 && (
                  <p className="text-center text-xs text-red-400 mt-2">
                    Vous n&apos;avez plus de crédits de lettre disponibles pour ce CV. Achetez un pass pour débloquer de nouvelles lettres.
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* TAB 2: VIEW & EDIT LETTER */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[400px]">
              {/* Left sidebar: Letter History List */}
              <div className="md:col-span-1 border-r border-slate-800/80 pr-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Historique ({letters.length})
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {letters.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => {
                        setSelectedLetter(l);
                        setEditedContent(l.content);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedLetter?.id === l.id
                          ? "bg-indigo-600/15 border-indigo-500 text-white"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-white truncate block max-w-[140px]">
                          {l.job_title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(l.id);
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {new Date(l.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel: Editable Text & Export Actions */}
              <div className="md:col-span-2 flex flex-col h-full">
                {selectedLetter ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Poste : {selectedLetter.job_title}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdits}
                          disabled={saving}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Enregistrer</span>
                        </button>

                        <button
                          onClick={handleExportPdf}
                          disabled={exportingPdf}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                        >
                          {exportingPdf ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Exporter en PDF</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={14}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Sélectionnez une lettre dans la liste ou générez-en une nouvelle.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
