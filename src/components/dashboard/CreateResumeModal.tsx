"use client";

import { useState } from "react";
import { X, FileText, Sparkles } from "lucide-react";

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, templateId: string) => Promise<void>;
}

export function CreateResumeModal({ isOpen, onClose, onCreate }: CreateResumeModalProps) {
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("modern");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title.trim(), templateId);
      setTitle("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Créer un nouveau CV</h2>
            <p className="text-sm text-slate-400">Donnez un titre à votre CV pour commencer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Titre du CV
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: CV Développeur Web 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Template initial
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "modern", name: "Moderne", desc: "Épuré et contemporain" },
                { id: "classic", name: "Classique", desc: "Traditionnel & élégant" },
                { id: "minimal", name: "Minimaliste", desc: "Simple et direct" },
                { id: "creative", name: "Créatif", desc: "Dynamique & visuel" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    templateId === t.id
                      ? "bg-indigo-600/10 border-indigo-500 text-white"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>{t.name}</span>
                    {templateId === t.id && <Sparkles className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer le CV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
