'use client'

import { User, Wallet } from 'lucide-react'
import { Translate } from '@/app/calculateur-aides/translation'

export default function CalculatorForm({ profile, setProfile, onCalculate, loading }) {
  const REGIONS = [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne",
    "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France",
    "Île-de-France", "Normandie", "Nouvelle-Aquitaine", "Occitanie",
    "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
  ];

  const STATUTS = [
    { value: 'etudiant', label: <Translate id="calculateur.status.etudiant" /> },
    { value: 'apprenti', label: <Translate id="calculateur.status.apprenti" /> },
    { value: 'demandeur_emploi', label: <Translate id="calculateur.status.chomeur" /> },
    { value: 'salarie', label: <Translate id="calculateur.status.salarie" /> },
    { value: 'jeune_insertion', label: <Translate id="calculateur.status.jeune_insertion" /> },
    { value: 'interimaire', label: <Translate id="calculateur.status.interimaire" /> },
    { value: 'reserve_militaire', label: <Translate id="calculateur.status.reserve_militaire" /> },
    { value: 'snu', label: <Translate id="calculateur.status.snu" /> },
    { value: 'autre', label: <Translate id="calculateur.status.autre" /> },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f5f9] space-y-6">

      {/* Section: Votre profil */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#0f172a] font-semibold">
          <User size={18} className="text-[#1414b8]" />
          <h2><Translate id="calculator_form.profile.title" /></h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"><Translate id="calculator_form.profile.age" /></label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1414b8]/20 transition-all text-[#0f172a]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"><Translate id="calculator_form.profile.region" /></label>
              <select
                value={profile.region}
                onChange={(e) => setProfile({...profile, region: e.target.value})}
                className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1414b8]/20 transition-all text-[#0f172a]"
              >
                <option value=""><Translate id="calculator_form.profile.region" /></option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"><Translate id="calculator_form.profile.status" /></label>
            <select
              value={profile.statut}
              onChange={(e) => setProfile({...profile, statut: e.target.value})}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1414b8]/20 transition-all text-[#0f172a]"
            >
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <hr className="border-[#f1f5f9]" />

      {/* Section: Situations spécifiques */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-[#0f172a] font-semibold mb-2">
          <Wallet size={18} className="text-[#1414b8]" />
          <h2><Translate id="calculator_form.specific.title" /></h2>
        </div>

        {[
          { id: 'has_rqth', label: <Translate id="calculator_form.specific.rqth" /> },
          { id: 'is_boursier', label: <Translate id="calculator_form.specific.boursier" /> },
          { id: 'inscrit_france_travail', label: <Translate id="calculator_form.specific.france_travail" /> },
          { id: 'beneficiaire_rsa', label: <Translate id="calculator_form.specific.rsa" /> },
          { id: 'en_formation_qualifiante', label: <Translate id="calculator_form.specific.formation" /> },
        ].map((item) => (
          <div key={item.id} className="space-y-3">
            <label className="text-sm text-[#0f172a] font-medium block">{item.label}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfile({...profile, [item.id]: true})}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                  profile[item.id]
                    ? 'bg-[#1414b8] border-[#1414b8] text-white shadow-md shadow-[#1414b8]/20'
                    : 'bg-white border-[#f1f5f9] text-[#64748b] hover:border-[#cbd5e1]'
                }`}
              >
                <Translate id="calculator_form.btn.yes" />
              </button>
              <button
                type="button"
                onClick={() => setProfile({...profile, [item.id]: false})}
                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                  !profile[item.id]
                    ? 'bg-[#1414b8] border-[#1414b8] text-white shadow-md shadow-[#1414b8]/20'
                    : 'bg-white border-[#f1f5f9] text-[#64748b] hover:border-[#cbd5e1]'
                }`}
              >
                <Translate id="calculator_form.btn.no" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onCalculate}
        disabled={loading}
        className="w-full bg-[#1414b8] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1414b8]/20 hover:bg-[#0e0e85] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span><Translate id="calculator_form.btn.calculating" /></span>
          </div>
        ) : <Translate id="calculator_form.btn.estimate" />}
      </button>
    </div>
  )
}
