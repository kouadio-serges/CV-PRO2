"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-red-500" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
          <XCircle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Paiement annulé</h1>

        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Votre transaction a été annulée ou interrompue. Aucun montant n&apos;a été débité de votre compte.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/pricing"
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer le paiement</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner au tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
