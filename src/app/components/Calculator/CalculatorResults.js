'use client'

import { CheckCircle2, Info, ChevronRight, Calculator as CalcIcon } from 'lucide-react'
import { Translate } from '@/app/calculateur-aides/translation'
import { safeExternalUrl } from '@/app/lib/safe-url'

export default function CalculatorResults({ results }) {
  if (!results) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Result Card */}
      <div className="bg-[#1414b8] rounded-2xl p-6 text-white shadow-xl shadow-[#1414b8]/20 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest"><Translate id="calculator_results.total_potential" /></p>
          <h3 className="text-4xl font-black">{results.total_potentiel}€</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <CalcIcon size={80} />
        </div>
      </div>

      {/* Aids List */}
      <div className="space-y-3">
        <h3 className="text-[#0f172a] font-bold px-1"><Translate id="calculator_results.details_title" /></h3>
        {results.aides.length > 0 ? (
          results.aides.map((aide, index) => (
            <div key={aide.id || index} className="bg-white rounded-xl p-4 border border-[#f1f5f9] flex items-start gap-4 hover:border-[#1414b8]/30 transition-colors group">
              <div className="bg-[#1414b8]/10 p-2 rounded-lg group-hover:bg-[#1414b8]/20 transition-colors">
                <CheckCircle2 size={20} className="text-[#1414b8]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#0f172a]">{aide.nom}</h4>
                  {aide.montant && <span className="text-[#1414b8] font-bold text-sm">+{aide.montant}€</span>}
                </div>
                <p className="text-[#64748b] text-xs leading-relaxed">{aide.description}</p>
                {aide.url_demande && (
                  <a
                    href={safeExternalUrl(aide.url_demande)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1414b8] text-[10px] font-bold flex items-center gap-1 mt-2 hover:underline"
                  >
                    <Translate id="calculator_results.view_details" /> <ChevronRight size={10} />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-8 border border-dashed border-[#e2e8f0] text-center">
            <p className="text-[#64748b] text-sm"><Translate id="calculator_results.no_aids_found" /></p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info size={18} className="text-blue-600 shrink-0" />
        <p className="text-blue-800 text-xs leading-relaxed">
          <Translate id="calculator_results.disclaimer" />
        </p>
      </div>
    </div>
  )
}
