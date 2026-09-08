"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, FileText, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Paiement Traité</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Paiement effectué avec succès !</h1>

        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Merci pour votre achat. Votre transaction a été enregistrée avec succès. Vos crédits seront automatiquement synchronisés sur votre compte dans quelques instants.
        </p>

        <Link
          href="/dashboard"
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <FileText className="w-4 h-4" />
          <span>Accéder au Tableau de Bord</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
