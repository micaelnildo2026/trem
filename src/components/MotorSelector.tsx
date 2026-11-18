import React, { useState } from 'react';
import { Zap, Trophy, CheckCircle, XCircle, BatteryCharging, Flame, Gauge, Info, Star } from 'lucide-react';
import { MOTOR_OPTIONS } from '../data/locomotiveData';
import { MotorOption } from '../types/locomotive';

interface Props {
  selectedMotorId: string;
  onSelectMotor: (motorId: string) => void;
}

export const MotorSelector: React.FC<Props> = ({ selectedMotorId, onSelectMotor }) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'electrical_setup'>('comparison');
  const currentMotor = MOTOR_OPTIONS.find((m) => m.id === selectedMotorId) || MOTOR_OPTIONS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Seleção & Dimensionamento do Motor de Tração
              <span className="text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Análise Comparativa
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Avaliação de 6 tecnologias de motorização (incluindo Motor Próprio e Parafusadeira ≤ R$ 200) frente às 4 provas oficiais
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'comparison' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Matriz de Comparação
          </button>
          <button
            onClick={() => setActiveTab('electrical_setup')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'electrical_setup' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Esquema Elétrico & Driver
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOTOR_OPTIONS.map((motor) => {
                const isSelected = motor.id === selectedMotorId;
                return (
                  <div
                    key={motor.id}
                    onClick={() => onSelectMotor(motor.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    {motor.recommended && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                        <Trophy className="w-3 h-3" /> Recomendado
                      </span>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight mb-2">
                        {motor.name}
                      </h3>

                      <div className="space-y-1.5 text-xs font-mono my-3 border-y border-slate-800/80 py-2.5">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Torque Nominal:</span>
                          <span className="font-bold text-amber-400">{motor.ratedTorque} N.m</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Torque de Stall:</span>
                          <span className="font-bold text-red-400">{motor.stallTorque} N.m</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Rotação Sob Carga:</span>
                          <span className="font-bold text-cyan-400">{motor.ratedRpm} RPM</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Corrente Nominal:</span>
                          <span className="text-white">{motor.ratedCurrent} A</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Peso do Motor:</span>
                          <span className="text-white">{motor.weight} g</span>
                        </div>
                      </div>

                      {/* Competition Scores */}
                      <div className="space-y-1 my-3 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Helpers (20kg):</span>
                          <span className="font-mono font-bold text-emerald-400">{motor.scoreHelpers}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Elevação (Rampa):</span>
                          <span className="font-mono font-bold text-cyan-400">{motor.scoreElevation}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Aceleração (2,5m):</span>
                          <span className="font-mono font-bold text-amber-400">{motor.scoreAcceleration}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cabo de Guerra:</span>
                          <span className="font-mono font-bold text-purple-400">{motor.scoreTugOfWar}/10</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? '✓ Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* In-depth Analysis of Selected Motor */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Parecer de Engenharia: {currentMotor.name}
                </h3>
                {currentMotor.recommended && (
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                    Classificação Técnica: Excelente
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {currentMotor.verdict}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4" /> Vantagens Competitivas
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {currentMotor.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/20">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2">
                    <XCircle className="w-4 h-4" /> Pontos de Atenção & Desafios
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {currentMotor.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400 shrink-0">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'electrical_setup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Battery Setup */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <BatteryCharging className="w-4 h-4 text-cyan-400" />
                  Alimentação Embarcada (Regulamento 3.h)
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    O regulamento proíbe terminantemente locomotivas alimentadas por tomadas elétricas ou fontes externas.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="text-cyan-400 font-bold">BATERIA RECOMENDADA:</div>
                    <div className="text-white">LiPo 4S (14.8V nominal / 16.8V full)</div>
                    <div className="text-slate-400">Capacidade: 5.200 mAh (Taxa de descarga: 50C)</div>
                    <div className="text-slate-400">Corrente de pico suportada: até 260A</div>
                    <div className="text-slate-400">Conector de alta potência: Amass XT60H</div>
                    <div className="text-emerald-400">Autonomia estimada: &gt; 45 minutos contínuos</div>
                  </div>
                </div>
              </div>

              {/* Driver Setup */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Driver de Potência (Ponte H BTS7960)
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Para suportar picos de 35A durante o Cabo de Guerra sem desarmar termicamente:
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="text-amber-400 font-bold">DRIVER RECOMENDADO:</div>
                    <div className="text-white">Módulo Ponte H Dupla BTS7960 (IBT-2)</div>
                    <div className="text-slate-400">Capacidade: 43A contínuos com dissipador</div>
                    <div className="text-slate-400">Tensão de operação: 5.5V a 27V</div>
                    <div className="text-slate-400">Frequência PWM: até 25 kHz (operação silenciosa)</div>
                    <div className="text-emerald-400">Proteção contra sobrecorrente e sobretemperatura</div>
                  </div>
                </div>
              </div>

              {/* Control Setup */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  Controle & Acionamento Remoto
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Recepção de comando via rádio 2.4GHz ou disparo por microswitch de trilho:
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="text-emerald-400 font-bold">SISTEMA DE CONTROLE:</div>
                    <div className="text-white">Microcontrolador ESP32 ou Arduino Nano</div>
                    <div className="text-slate-400">Receptor FlySky FS-iA6B (PWM / PPM)</div>
                    <div className="text-slate-400">Rampa suave de aceleração (Anti-Slip Traction Control)</div>
                    <div className="text-cyan-400">Chave geral tipo Kill-Switch de segurança externa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
