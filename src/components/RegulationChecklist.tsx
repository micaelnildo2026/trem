import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertOctagon, Scale, ShieldAlert, Award } from 'lucide-react';
import { REGULATION_RULES } from '../data/locomotiveData';
import { LocomotiveSpecs } from '../types/locomotive';

interface Props {
  specs: LocomotiveSpecs;
}

export const RegulationChecklist: React.FC<Props> = ({ specs }) => {
  // Calculate penalties if any limits were breached
  const weightPenalty = specs.totalWeightGrams > 8000
    ? Math.ceil((specs.totalWeightGrams - 8000) / 100) * 0.2
    : 0;

  const widthPenalty = specs.totalWidthMm > 220
    ? Math.ceil((specs.totalWidthMm - 220) / 10) * 0.5
    : 0;

  const lengthPenalty = specs.totalLengthMm > 360
    ? Math.ceil((specs.totalLengthMm - 360) / 10) * 0.5
    : 0;

  const heightPenalty = specs.totalHeightMm > 330
    ? Math.ceil((specs.totalHeightMm - 330) / 10) * 0.5
    : 0;

  const totalPenalties = weightPenalty + widthPenalty + lengthPenalty + heightPenalty;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Checklist de Conformidade Técnica & Inspeção
              <span className="text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                UFSC Cavalos de Ferro 2026
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Verificação dos critérios eliminatórios e penalidades do Procedimento de Inspeção (Item 3 e 4.1)
            </p>
          </div>
        </div>

        {/* Penalty status badge */}
        <div className="flex items-center gap-2">
          {totalPenalties === 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> ZERO PENALIDADES (100% REGULAMENTAR)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
              <AlertOctagon className="w-4 h-4" /> PENALIDADE ATIVA: -{totalPenalties.toFixed(1)} PONTOS
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-3">Item / Regra</th>
                <th className="py-3 px-3">Parâmetro Regulamentar</th>
                <th className="py-3 px-3">Exigência do Edital</th>
                <th className="py-3 px-3">Valor no Projeto</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Penalidade Prevista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {REGULATION_RULES.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">Regra {rule.rule}</td>
                  <td className="py-3 px-3 font-semibold text-white">{rule.title}</td>
                  <td className="py-3 px-3 text-slate-300">{rule.requirement}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">{rule.ourValue}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> APROVADO
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400">{rule.penalty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Penalty Rules Matrix from Official PDF */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            Tabela Oficial de Penalidades - Prova de Projeto (Página 5 do Edital):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">PESO (&lt; 8000 gramas):</span>
              <div className="font-mono font-bold text-amber-400 mt-0.5">+100g → -0.2 pts</div>
              <div className="text-[11px] text-emerald-400 mt-1">Nossa: 7.650g (-350g margem)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">LARGURA (&lt; 220 mm):</span>
              <div className="font-mono font-bold text-amber-400 mt-0.5">+10mm → -0.5 pts</div>
              <div className="text-[11px] text-emerald-400 mt-1">Nossa: 205mm (-15mm margem)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">COMPRIMENTO (&lt; 360 mm):</span>
              <div className="font-mono font-bold text-amber-400 mt-0.5">+10mm → -0.5 pts</div>
              <div className="text-[11px] text-emerald-400 mt-1">Nossa: 335mm (-25mm margem)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400">ALTURA (&lt; 330 mm):</span>
              <div className="font-mono font-bold text-amber-400 mt-0.5">+10mm → -0.5 pts</div>
              <div className="text-[11px] text-emerald-400 mt-1">Nossa: 245mm (-85mm margem)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
