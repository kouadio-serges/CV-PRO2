"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Loader2,
  CreditCard,
} from "lucide-react";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = async (plan: "demo" | "cv") => {
    setErrorMessage(null);

    if (status === "unauthenticated") {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setLoadingPlan(plan);
      const res = await fetch("/api/cinetpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'initialiser le paiement.");
      }

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("URL de paiement CinetPay introuvable.");
      }
    } catch (err: any) {
      console.error("Purchase error:", err);
      setErrorMessage(err.message || "Une erreur est survenue lors de l'initialisation.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-white"
          >
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span>CV<span className="text-indigo-400">Pro</span></span>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tableau de bord</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Tarification simple &amp; sans abonnement</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-center tracking-tight max-w-3xl">
          Choisissez l&apos;offre adaptée à vos besoins professionnels
        </h1>

        <p className="mt-4 text-slate-400 text-center text-base md:text-lg max-w-xl">
          Paiement unique sécurisé par Mobile Money et Carte Bancaire via CinetPay.
        </p>

        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md w-full text-center">
            {errorMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Card 1: Pass Démo */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all relative">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Pass Démo</h3>
                  <p className="text-slate-400 text-xs mt-1">Idéal pour un besoin rapide ou unique</p>
                </div>
                <div className="p-2.5 bg-slate-800 rounded-2xl text-slate-300">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">1 500</span>
                <span className="text-slate-400 text-lg font-medium ml-2">XOF</span>
                <span className="block text-xs text-slate-500 mt-1">Paiement unique sans engagement</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span><strong>1 Crédit d&apos;exportation CV PDF</strong> haute définition</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span><strong>1 Génération de lettre de motivation IA</strong> personnalisée</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Accès à tous les modèles de CV professionnels</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Assistance et support standard</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchase("demo")}
              disabled={loadingPlan !== null}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              {loadingPlan === "demo" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement CinetPay...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Acheter le Pass Démo</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Plan CV Pro (Popular) */}
          <div className="bg-slate-900/90 border-2 border-indigo-500/50 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-indigo-500/10 hover:border-indigo-500 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
              Recommandé
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Plan CV Pro</h3>
                  <p className="text-slate-400 text-xs mt-1">Meilleure offre pour plusieurs candidatures</p>
                </div>
                <div className="p-2.5 bg-indigo-600/20 rounded-2xl text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">3 000</span>
                <span className="text-slate-400 text-lg font-medium ml-2">XOF</span>
                <span className="block text-xs text-indigo-300 mt-1">Économisez sur vos candidatures</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span><strong>2 Crédits d&apos;exportation CV PDF</strong> haute définition</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span><strong>Lettres de motivation IA illimitées</strong> sur les CV débloqués</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Accès complet à l&apos;ensemble des fonctionnalités</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Support prioritaire par email</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchase("cv")}
              disabled={loadingPlan !== null}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loadingPlan === "cv" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement CinetPay...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Acheter le Plan CV Pro</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security assurance */}
        <div className="mt-16 flex items-center gap-2 text-slate-400 text-xs bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Paiements sécurisés cryptés par CinetPay • Orange Money, MTN MoMo, Wave, Moov, Carte Visa/Mastercard</span>
        </div>
      </main>
    </div>
  );
}
