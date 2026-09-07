import Link from "next/link";
import { FileText, Sparkles, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <span>CV<span className="text-indigo-400">Pro</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/30"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Générateur de CV SaaS & IA</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Créez un CV d&apos;exception &amp; décrochez vos{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
            entretiens rapidement
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-2xl font-normal leading-relaxed">
          Générez un CV au format professionnel, personnalisez les sections en temps réel et obtenez des lettres de motivation rédigées par l&apos;IA.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <span>Commencer gratuitement</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-base font-semibold px-8 py-3.5 rounded-xl transition-all"
          >
            <span>Se connecter</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl text-left">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">Templates Pro &amp; PDF</h3>
            <p className="text-slate-400 text-sm">Design personnalisable avec export PDF haute définition via Puppeteer.</p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">Lettre de Motivation IA</h3>
            <p className="text-slate-400 text-sm">IA Anthropic adaptant automatiquement votre CV à l&apos;offre ciblée.</p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">Paiement Sécurisé CinetPay</h3>
            <p className="text-slate-400 text-sm">Intégration CinetPay API Aurore (v1) avec validation serveur sécurisée.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        © 2026 CVPro. Tous droits réservés.
      </footer>
    </div>
  );
}
