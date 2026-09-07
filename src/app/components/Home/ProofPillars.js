"use client";

import { BarChart3, Clock3, Gauge, HelpCircle } from "lucide-react";
import { Translate } from "@/app/calculateur-aides/translation";

const pillars = [
  {
    titleKey: "pillars.1.title",
    icon: BarChart3,
    descKey: "pillars.1.desc",
  },
  {
    titleKey: "pillars.2.title",
    icon: HelpCircle,
    descKey: "pillars.2.desc",
  },
  {
    titleKey: "pillars.3.title",
    icon: Gauge,
    descKey: "pillars.3.desc",
  },
];

export default function ProofPillars() {
  return (
    <section className="px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl border-t border-[#303235]/20 pt-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-normal text-[#303235] sm:text-4xl md:text-5xl">
              <Translate id="pillars.main_title" />
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5c6974]">
              <Translate id="pillars.main_desc" />
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                key={pillar.titleKey}
                className="min-h-64 rounded-2xl border border-[#303235]/20 bg-[#eef5f9]/72 p-5 shadow-[0_18px_55px_-45px_rgba(48,50,53,0.8)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#303235]/15 bg-white/55 text-[#303235]">
                    <Icon size={23} strokeWidth={2.15} />
                  </div>
                </div>

                <h3 className="mt-8 text-2xl font-black leading-tight tracking-normal text-[#303235]">
                  <Translate id={pillar.titleKey} />
                </h3>
                <p className="mt-4 text-sm leading-6 text-[#5d6a75]">
                  <Translate id={pillar.descKey} />
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
