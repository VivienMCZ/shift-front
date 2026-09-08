"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Briefcase, GraduationCap, Building2, User, HelpCircle, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Translate, fetchTextByKey } from "@/app/calculateur-aides/translation";
import { safeExternalUrl } from '@/app/lib/safe-url'


export default function CalculateurAides() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: "",
    postalCode: "",
    status: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [agePlaceholder, setAgePlaceholder] = useState("Ex: 18");
  const [cpPlaceholder, setCpPlaceholder] = useState("Ex: 75001");

  const statuses = [
    { id: "lyceen", label: <Translate id="calculateur.status.lyceen" />, icon: User },
    { id: "etudiant", label: <Translate id="calculateur.status.etudiant" />, icon: GraduationCap },
    { id: "apprenti", label: <Translate id="calculateur.status.apprenti" />, icon: Briefcase },
    { id: "salarie", label: <Translate id="calculateur.status.salarie" />, icon: Building2 },
    { id: "chomeur", label: <Translate id="calculateur.status.chomeur" />, icon: HelpCircle },
    { id: "autre", label: <Translate id="calculateur.status.autre" />, icon: User },
  ];

  useEffect(() => {
    fetchTextByKey("calculateur.placeholder.age").then(setAgePlaceholder);
    fetchTextByKey("calculateur.placeholder.cp").then(setCpPlaceholder);
  }, []);

  // Pre-fill form if user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        age: user.age ? String(user.age) : prev.age,
        postalCode: user.postal_code || prev.postalCode,
        status: user.statut || prev.status,
      }));
    }
  }, [user]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.age) newErrors.age = <Translate id="calculateur.error.age_missing" />;
    else if (isNaN(formData.age) || formData.age < 15 || formData.age > 99) newErrors.age = <Translate id="calculateur.error.age_invalid" />;
    
    if (!formData.postalCode) newErrors.postalCode = <Translate id="calculateur.error.cp_missing" />;
    else if (!/^\d{5}$/.test(formData.postalCode)) newErrors.postalCode = <Translate id="calculateur.error.cp_invalid" />;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.status) newErrors.status = <Translate id="calculateur.error.status_missing" />;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    setApiError(null);
    try {
      const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

      // If user is logged in, save these details to their profile in background
      if (user) {
        fetch(`${API_URL}/auth/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            age: Number(formData.age),
            postal_code: formData.postalCode,
            statut: formData.status
          })
        }).then(() => checkAuth()).catch(console.error); // refresh AuthContext silently
      }

      // Map formData to API expected format
      const payload = {
        age: Number(formData.age),
        statut: formData.status,
        code_postal: formData.postalCode,
        has_rqth: false,
        is_boursier: false,
        inscrit_france_travail: formData.status === "chomeur",
        beneficiaire_rsa: false,
        en_formation_qualifiante: false,
      };

      // credentials: "include" => envoie le cookie de session pour que la
      // recherche soit sauvegardée côté backend si l'utilisateur est connecté.
      const res = await fetch(`${API_URL}/api/v1/aides/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      setResults(data);
      setStep(3);
      window.scrollTo(0, 0);
    } catch (err) {
      setApiError(<Translate id="calculateur.error.api_fetch" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#dce5ec] px-4 py-12 sm:px-6 lg:px-8 md:pt-32">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-[#1e293b] sm:text-5xl">
            <Translate id="calculateur.title" />
          </h1>
          <p className="mt-4 text-lg text-[#64748b]">
            <Translate id="calculateur.subtitle" />
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Progress Bar */}
          {step < 3 && (
            <div className="mb-8">
              <div className="flex justify-between text-sm font-bold text-[#64748b] mb-2">
                <span className={step >= 1 ? "text-[#0047FF]" : ""}><Translate id="calculateur.step1" /></span>
                <span className={step >= 2 ? "text-[#0047FF]" : ""}><Translate id="calculateur.step2" /></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                <m.div
                  className="h-full bg-[#0047FF]"
                  initial={{ width: "50%" }}
                  animate={{ width: step === 1 ? "50%" : "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <m.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="age" className="block text-sm font-bold text-[#334155]">
                    <Translate id="calculateur.label.age" />
                  </label>
                  <input
                    type="number"
                    id="age"
                    placeholder={agePlaceholder}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className={`mt-2 block w-full rounded-xl border ${errors.age ? 'border-red-500' : 'border-slate-200'} bg-white p-4 text-lg font-bold text-[#334155] focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20`}
                  />
                  {errors.age && <p className="mt-2 text-sm font-semibold text-red-500">{errors.age}</p>}
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-bold text-[#334155]">
                    <Translate id="calculateur.label.cp" />
                  </label>
                  <p className="text-xs font-semibold text-[#64748b] mb-2"><Translate id="calculateur.desc.cp" /></p>
                  <input
                    type="text"
                    id="postalCode"
                    placeholder={cpPlaceholder}
                    maxLength={5}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '') })}
                    className={`block w-full rounded-xl border ${errors.postalCode ? 'border-red-500' : 'border-slate-200'} bg-white p-4 text-lg font-bold text-[#334155] focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20`}
                  />
                  {errors.postalCode && <p className="mt-2 text-sm font-semibold text-red-500">{errors.postalCode}</p>}
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleNext}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] p-4 text-lg font-black text-white shadow-lg transition-all hover:bg-[#003bd6] hover:-translate-y-0.5 active:scale-95"
                  >
                    <Translate id="calculateur.btn.next" /> <ArrowRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </m.div>
            )}

            {step === 2 && (
              <m.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold text-[#334155] mb-4">
                    <Translate id="calculateur.label.status" />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {statuses.map((s) => {
                      const Icon = s.icon;
                      const isSelected = formData.status === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setFormData({ ...formData, status: s.id })}
                          className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-[#0047FF] bg-[#0047FF]/5 shadow-md' 
                              : 'border-slate-200 bg-white hover:border-[#0047FF]/30'
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-[#0047FF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={20} strokeWidth={2.5} />
                          </div>
                          <span className={`font-bold ${isSelected ? 'text-[#0047FF]' : 'text-slate-600'}`}>{s.label}</span>
                          {isSelected && (
                            <CheckCircle2 className="absolute right-4 text-[#0047FF]" size={20} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.status && <p className="mt-3 text-sm font-semibold text-red-500">{errors.status}</p>}
                </div>

                {apiError && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      {apiError}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex w-14 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                  >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0047FF] p-4 text-lg font-black text-white shadow-lg transition-all hover:bg-[#003bd6] hover:-translate-y-0.5 active:scale-95 disabled:opacity-75 disabled:hover:-translate-y-0"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> : <Translate id="calculateur.btn.submit" />}
                    {!loading && <ArrowRight size={20} strokeWidth={2.5} />}
                  </button>
                </div>
              </m.div>
            )}

            {step === 3 && results && (
              <m.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    <Translate id="calculateur.result.title" />
                  </h2>
                  <p className="mt-2 text-slate-500 font-medium">
                    <Translate id="calculateur.result.subtitle_part1" /><span className="text-emerald-600 font-black">{results.total_potentiel}€</span>.
                  </p>
                </div>

                <div className="space-y-4">
                  {results.aides.length > 0 ? (
                    results.aides.map((aide, idx) => (
                      <div key={idx} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#0047FF] bg-[#0047FF]/10 px-2 py-1 rounded-md">
                              {aide.categorie || <Translate id="calculateur.result.default_category" />}
                            </span>
                            <h3 className="mt-2 text-lg font-black text-slate-900">{aide.nom}</h3>
                            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{aide.description}</p>
                          </div>
                          {aide.montant && (
                            <div className="shrink-0 text-right">
                              <span className="text-xl font-black text-emerald-600">{aide.montant}€</span>
                            </div>
                          )}
                        </div>
                        {aide.url_demande && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <a href={safeExternalUrl(aide.url_demande)} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0047FF] hover:underline">
                              <Translate id="calculateur.result.how_to_apply" /> &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                      <p className="text-slate-600 font-medium"><Translate id="calculateur.result.no_aides" /></p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Link
                    href="/comparer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0047FF] p-4 text-lg font-black text-white shadow-lg transition-all hover:bg-[#003bd6] hover:-translate-y-0.5 active:scale-95"
                  >
                    <Translate id="calculateur.btn.compare" /> <ArrowRight size={20} />
                  </Link>
                  <button
                    onClick={() => { setStep(1); setResults(null); }}
                    className="mt-4 w-full text-center text-sm font-bold text-slate-500 hover:text-slate-800 underline underline-offset-4"
                  >
                    <Translate id="calculateur.btn.recalculate" />
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
