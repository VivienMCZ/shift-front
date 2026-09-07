"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, Calculator, ShieldCheck } from "lucide-react";
import { Translate } from "@/app/calculateur-aides/translation";

const Spline = dynamic(() => import('@splinetool/react-spline'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0047FF]/20 border-t-[#0047FF]"></div>
    </div>
  )
});

export default function HeroSection() {
  const [ageGroup, setAgeGroup] = useState("");
  const [status, setStatus] = useState("");

  let estimatedAid = <Translate id="hero.aid.default" />;
  if (status === "apprenti") estimatedAid = <Translate id="hero.aid.apprenti" />;
  else if (status === "chomeur") estimatedAid = <Translate id="hero.aid.chomeur" />;
  else if (ageGroup === "15-17") estimatedAid = <Translate id="hero.aid.jeune" />;
  else if (ageGroup || status) estimatedAid = <Translate id="hero.aid.autre" />;

  return (
    <section className="relative isolate px-4 pb-10 pt-10 sm:px-6 md:pb-16 md:pt-24 lg:px-8 overflow-hidden">
      {/* Fond plus vibrant */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#e0f2fe_0%,#bae6fd_48%,#7dd3fc_100%)] opacity-80" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-[#0047FF]/10" />

      {/* Decorative blobs for vibrancy */}
      <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4 transform blur-3xl opacity-50">
        <div className="aspect-square w-[600px] rounded-full bg-gradient-to-tr from-[#0047FF] to-[#38bdf8]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl"
        >
          {/* Badge Social Proof */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0047FF]/20 bg-white/60 px-3 py-1.5 backdrop-blur-md"
          >
            <ShieldCheck className="text-[#0047FF]" size={18} />
            <span className="text-sm font-bold text-[#0047FF]"><Translate id="hero.badge" /></span>
          </motion.div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-[#1e293b] sm:text-6xl md:text-7xl lg:text-[4.5rem]">
            <Translate id="hero.title.part1" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0047FF] to-[#0ea5e9]"><Translate id="hero.title.part2" /></span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg sm:leading-8">
            <Translate id="hero.subtitle" />
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/calculateur-aides"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0047FF] px-8 text-[17px] font-black text-white shadow-[0_18px_45px_-15px_rgba(0,71,255,0.7)] transition-all hover:bg-[#003bd6] hover:shadow-[0_20px_50px_-15px_rgba(0,71,255,0.8)] hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto"
            >
              <span className="whitespace-nowrap"><Translate id="hero.btn.estimate" /></span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 flex items-center gap-4 border-t border-[#0047FF]/15 pt-6"
          >
            <div className="flex -space-x-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[#e0f2fe] bg-slate-200 overflow-hidden flex-shrink-0">
                  <Image src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=e2e8f0`} alt="Avatar" width={40} height={40} unoptimized />
                </div>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e0f2fe] bg-[#0047FF] text-xs font-bold text-white flex-shrink-0 z-10">
                <Translate id="hero.social_proof.count" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex text-[#f59e0b]">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <span className="text-sm font-semibold text-[#475569]"><Translate id="hero.social_proof.text" /></span>
            </div>
          </motion.div>
        </motion.div>

        {/* Côté droit : Image 3D + Simulateur */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none mt-12 lg:mt-0"
        >
          {/* L'image 3D générée en fond / déco (remplacée par Spline) */}
          <div className="absolute -top-20 -right-4 lg:-top-32 lg:-right-12 -z-10 w-72 h-72 lg:w-[550px] lg:h-[550px] drop-shadow-2xl opacity-95 pointer-events-auto">
             <Spline scene="https://prod.spline.design/lk72hQmn1jcV6dEU/scene.splinecode" />
          </div>

          <div className="relative mt-8 lg:mt-0 rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_32px_80px_-20px_rgba(0,30,100,0.15)] backdrop-blur-xl">
            <div className="absolute -top-6 left-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0047FF] to-[#38bdf8] text-white shadow-lg">
              <Calculator size={24} strokeWidth={2.5} />
            </div>

            <div className="mb-6 mt-4">
              <h3 className="text-xl font-black text-[#1e293b]"><Translate id="hero.simulator.title" /></h3>
              <p className="text-sm font-medium text-[#64748b]"><Translate id="hero.simulator.subtitle" /></p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#334155]"><Translate id="hero.simulator.age_label" /></label>
                <div className="grid grid-cols-3 gap-2">
                  {["15-17", "18-25", "26+"].map((age) => (
                    <button
                      key={age}
                      onClick={() => setAgeGroup(age)}
                      className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                        ageGroup === age 
                        ? "bg-[#0047FF] text-white shadow-md" 
                        : "bg-white/80 text-[#64748b] hover:bg-white border border-slate-200"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#334155]"><Translate id="hero.simulator.status_label" /></label>
                <div className="relative">
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 p-3 pr-10 text-sm font-bold text-[#334155] focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 cursor-pointer"
                  >
                    <option value=""><Translate id="hero.simulator.status.select" /></option>
                    <option value="etudiant"><Translate id="hero.simulator.status.etudiant" /></option>
                    <option value="apprenti"><Translate id="hero.simulator.status.apprenti" /></option>
                    <option value="chomeur"><Translate id="hero.simulator.status.chomeur" /></option>
                    <option value="salarie"><Translate id="hero.simulator.status.salarie" /></option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#64748b]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {(ageGroup || status) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: "auto" }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400"><Translate id="hero.simulator.result.label" /></p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[#38bdf8]">{estimatedAid}</span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 size={14} className="text-[#38bdf8] shrink-0 mt-0.5" />
                        <Translate id="hero.simulator.result.disclaimer" />
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
      </div>

      {/* Animation globale (floating) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />
    </section>
  );
}
