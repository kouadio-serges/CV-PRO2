"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit,
  CreditCard,
  LogOut,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CreateResumeModal } from "@/components/dashboard/CreateResumeModal";

interface ResumeItem {
  id: string;
  title: string;
  template_id: string;
  accent_color: string;
  cover_letter_allowance: number;
  created_at: string;
  updated_at: string;
  slug: string;
  _count?: {
    sections: number;
    cover_letters: number;
  };
}

interface PaymentTx {
  id: string;
  transaction_id: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [cvCredits, setCvCredits] = useState<number>(0);
  const [transactions, setTransactions] = useState<PaymentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      if (res.ok) {
        const data = await res.json();
        setCvCredits(data.cv_credits || 0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      Promise.all([fetchResumes(), fetchSubscription()]).finally(() =>
        setLoading(false)
      );
    }
  }, [status, router, fetchResumes, fetchSubscription]);

  const handleCreateResume = async (title: string, templateId: string) => {
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, template_id: templateId }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchResumes();
        router.push(`/editor/${data.resume.id}`);
      }
    } catch (err) {
      console.error("Error creating resume:", err);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchResumes();
      }
    } catch (err) {
      console.error("Error duplicating resume:", err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce CV ? Cette action est irréversible.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchResumes();
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span>CV<span className="text-indigo-400">Pro</span></span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                {session?.user?.name ? session.user.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-white leading-tight">
                  {session?.user?.name || "Utilisateur"}
                </div>
                <div className="text-xs text-slate-400">{session?.user?.email}</div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Upper Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Tableau de bord</h1>
            <p className="text-slate-400 text-sm mt-1">Gérez vos CV et téléchargez vos documents professionnels</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau CV</span>
          </button>
        </div>

        {/* Section Mes CV */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Mes CV ({resumes.length})</span>
            </h2>
          </div>

          {resumes.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Aucun CV créé pour le moment</h3>
              <p className="text-slate-400 text-sm max-w-md mb-6">
                Créez votre premier CV en quelques clics et choisissez parmi nos modèles professionnels.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Créer mon premier CV
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((cv) => (
                <div
                  key={cv.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cv.accent_color || "#4F46E5" }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Template {cv.template_id}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(cv.updated_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {cv.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2">
                      {cv._count?.sections || 0} sections renseignées
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/editor/${cv.id}`}
                      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Éditer</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicate(cv.id)}
                        disabled={duplicatingId === cv.id}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(cv.id)}
                        disabled={deletingId === cv.id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Mon Abonnement */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Mon Abonnement &amp; Crédits</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Crédits d&apos;exportation CV</h2>
              <p className="text-slate-400 text-sm mt-1">
                Chaque crédit vous permet de débloquer l&apos;export PDF d&apos;un CV + 1 génération de lettre de motivation IA.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Crédits disponibles</div>
                <div className="text-3xl font-extrabold text-indigo-400">{cvCredits}</div>
              </div>
              <button
                onClick={() => router.push("/#pricing")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 whitespace-nowrap"
              >
                Acheter des crédits
              </button>
            </div>
          </div>

          {/* Table d'historique des paiements */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
              Historique des paiements ({transactions.length})
            </h3>

            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucune transaction enregistrée pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID Transaction</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{tx.transaction_id}</td>
                        <td className="px-4 py-3 font-medium text-white capitalize">
                          {tx.plan === "demo" ? "Pass Démo" : "Plan CV Pro"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">{tx.amount} XOF</td>
                        <td className="px-4 py-3">
                          {tx.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complété</span>
                            </span>
                          )}
                          {tx.status === "pending" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              <span>En attente</span>
                            </span>
                          )}
                          {tx.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Échoué</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateResumeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateResume}
      />
    </div>
  );
}
