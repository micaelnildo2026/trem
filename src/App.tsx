/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Train, 
  Cog, 
  Zap, 
  Target, 
  ClipboardCheck, 
  Printer, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  FileDown,
  Leaf,
  Wallet
} from 'lucide-react';
import { Compass } from 'lucide-react';
import { ThreeLocomotiveViewer } from './components/ThreeLocomotiveViewer';
import { TransmissionSystem } from './components/TransmissionSystem';
import { KinematicDrawing } from './components/KinematicDrawing';
import { MotorSelector } from './components/MotorSelector';
import { SustainableLocomotiveBuilder } from './components/SustainableLocomotiveBuilder';
import { BudgetLocomotiveBuilder } from './components/BudgetLocomotiveBuilder';
import { CompetitionSimulators } from './components/CompetitionSimulators';
import { RegulationChecklist } from './components/RegulationChecklist';
import { Print3DSpecs } from './components/Print3DSpecs';
import { TechnicalReport } from './components/TechnicalReport';
import { CadReferenceGallery } from './components/CadReferenceGallery';
import { FullProjectPdfExport } from './components/FullProjectPdfExport';
import { DEFAULT_TRANSMISSION, DEFAULT_LOCOMOTIVE_SPECS, MOTOR_OPTIONS } from './data/locomotiveData';
import { TransmissionConfig, LocomotiveSpecs, MotorOption } from './types/locomotive';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'viewer' | 'drawing' | 'transmission' | 'motor' | 'sustainable' | 'budget200' | 'simulator' | 'regulation' | 'print3d' | 'report' | 'gallery'
  >('drawing');

  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const [transmission, setTransmission] = useState<TransmissionConfig>(DEFAULT_TRANSMISSION);
  const [specs, setSpecs] = useState<LocomotiveSpecs>(DEFAULT_LOCOMOTIVE_SPECS);
  const [selectedMotorId, setSelectedMotorId] = useState<string>('motor-775-planetary');
  const [customSustainableMotor, setCustomSustainableMotor] = useState<MotorOption | null>(null);
  const [customBudgetMotor, setCustomBudgetMotor] = useState<MotorOption | null>(null);

  const baseMotor = MOTOR_OPTIONS.find((m) => m.id === selectedMotorId) || MOTOR_OPTIONS[0];
  const selectedMotor =
    selectedMotorId === 'motor-diy-sustainable-afpm' && customSustainableMotor
      ? customSustainableMotor
      : selectedMotorId === 'motor-parafusadeira-12v' && customBudgetMotor
      ? customBudgetMotor
      : baseMotor;

  const handleSelectMotor = (motorId: string) => {
    setSelectedMotorId(motorId);
    const motor =
      motorId === 'motor-diy-sustainable-afpm' && customSustainableMotor
        ? customSustainableMotor
        : motorId === 'motor-parafusadeira-12v' && customBudgetMotor
        ? customBudgetMotor
        : MOTOR_OPTIONS.find((m) => m.id === motorId);
    if (motor) {
      setTransmission((prev) => ({
        ...prev,
        motorRpm: motor.ratedRpm,
        internalGearboxRatio:
          motorId === 'motor-diy-sustainable-afpm'
            ? 5.0
            : motorId === 'motor-parafusadeira-12v'
            ? 36.0
            : 19.2,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Event Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Train className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base tracking-tight">
                    CAVALOS DE FERRO 2026
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                    Edital 2026
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Engenharia Mecânica da Locomotiva 4WD (Bitola 150 mm • Engrenagens + Correia GT2)
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">Bitola:</span>
                <span className="text-cyan-400 font-bold">150 mm</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">Engate:</span>
                <span className="text-emerald-400 font-bold">107.5 mm</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">Massa:</span>
                <span className="text-amber-400 font-bold">7.65 kg (&lt;8kg)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">Tração:</span>
                <span className="text-purple-400 font-bold">4 Rodas (AWD)</span>
              </div>

              {/* PDF Export Action Button */}
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 ring-1 ring-white/20 active:scale-95 ml-1 cursor-pointer"
                title="Exportar Memorial Descritivo Completo e Desenhos Tudo Junto em PDF"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar Tudo Junto em PDF</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'viewer'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Train className="w-4 h-4" />
              <span>Visualizador 3D</span>
            </button>

            <button
              onClick={() => setActiveTab('drawing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'drawing'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Desenho Técnico (Motor & Rodas)</span>
            </button>

            <button
              onClick={() => setActiveTab('transmission')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'transmission'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cog className="w-4 h-4" />
              <span>Transmissão 4x4 (Engrenagem + GT2)</span>
            </button>

            <button
              onClick={() => setActiveTab('motor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'motor'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Escolha do Motor</span>
            </button>

            <button
              onClick={() => setActiveTab('sustainable')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'sustainable'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span>Solução Sustentável &amp; Motor Próprio</span>
            </button>

            <button
              onClick={() => setActiveTab('budget200')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'budget200'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Projeto ≤ R$ 200 (Parafusadeira)</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Simulador das 4 Provas</span>
            </button>

            <button
              onClick={() => setActiveTab('regulation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'regulation'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Regulamento & Penalidades</span>
            </button>

            <button
              onClick={() => setActiveTab('print3d')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'print3d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Impressão 3D & Fatiamento</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'report'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Memorial Descritivo (Defesa 10 min)</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === 'gallery'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Galeria CAD (Onshape)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Executive Summary */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Projeto Homologado: Locomotiva 4WD de Alto Torque para Desafio de Ferromodelismo
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Desenvolvida em conformidade estrita com o arquivo{' '}
              <a
                href="/assets/aistudio/Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf"
                download="Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf"
                className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 font-mono"
              >
                Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
              </a>
              : <strong>bitola central de 150 mm</strong>, <strong>altura de engate de 107,5 mm</strong>,{' '}
              <strong>tração integral nas 4 rodas</strong> com <strong>redução cilíndrica de engrenagens M1.0 (3:1)</strong> e{' '}
              <strong>correia dentada GT2 fechada (1:1)</strong> acionadas por{' '}
              <strong>Motor DC 775 com redutor planetário metálico (1:19.2)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 ring-1 ring-white/20 active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" /> Exportar Tudo Junto em PDF (7 Págs)
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" /> Roteiro de Defesa (10 min)
            </button>
          </div>
        </div>

        {/* Tab Viewport Rendering */}
        {activeTab === 'viewer' && (
          <div className="space-y-6">
            <ThreeLocomotiveViewer transmission={transmission} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab('transmission')}
                className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">TRANSMISSÃO 4WD</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-semibold text-white">Engrenagens M1.0 + Correia GT2</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Redução total de 57.6:1 e 100% de sincronismo nos dois eixos separados por 160 mm.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('motor')}
                className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">MOTORIZAÇÃO</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-semibold text-white">Motor DC 775 + Planetária Metálica</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Torque de stall de 18.5 N.m, sem perda de passos e robustez inigualável para o Cabo de Guerra.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('simulator')}
                className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-purple-400">SIMULAÇÃO DAS 4 PROVAS</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-semibold text-white">Helpers 20kg, Rampa 20°, Aceleração, Cabo de Guerra</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Previsão física precisa de tração e tempos para vencer a competição.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drawing' && (
          <KinematicDrawing transmission={transmission} specs={specs} />
        )}

        {activeTab === 'transmission' && (
          <TransmissionSystem
            config={transmission}
            onChangeConfig={(newConfig) => setTransmission(newConfig)}
          />
        )}

        {activeTab === 'motor' && (
          <MotorSelector
            selectedMotorId={selectedMotorId}
            onSelectMotor={handleSelectMotor}
          />
        )}

        {activeTab === 'sustainable' && (
          <SustainableLocomotiveBuilder
            isSustainableMotorActive={selectedMotorId === 'motor-diy-sustainable-afpm'}
            transmission={transmission}
            specs={specs}
            onActivateSustainableSolution={({ customMotorOutput, customMotorInput, sustainableSpecs }) => {
              const diyBase = MOTOR_OPTIONS.find((m) => m.id === 'motor-diy-sustainable-afpm') || MOTOR_OPTIONS[0];
              const updatedMotor: MotorOption = {
                ...diyBase,
                name: `Motor Próprio Sustentável AFPM ${customMotorInput.statorCoils}N${customMotorInput.rotorPoles}P + Planetária 3D ${customMotorInput.planetaryRatio.toFixed(1)}:1`,
                voltage: customMotorInput.supplyVoltageV,
                noLoadRpm: Math.round(customMotorOutput.rawNoLoadRpm / customMotorInput.planetaryRatio),
                ratedRpm: customMotorOutput.gearboxOutputRpm,
                ratedTorque: customMotorOutput.gearboxRatedTorqueNm,
                stallTorque: customMotorOutput.gearboxStallTorqueNm,
                ratedCurrent: customMotorInput.continuousCurrentA,
                stallCurrent: customMotorInput.escPeakCurrentLimitA,
                weight: customMotorOutput.estimatedMotorMassG,
                efficiency: customMotorOutput.efficiencyPercent,
              };
              setCustomSustainableMotor(updatedMotor);
              setSelectedMotorId('motor-diy-sustainable-afpm');
              setSpecs(sustainableSpecs);
              setTransmission((prev) => ({
                ...prev,
                motorRpm: customMotorOutput.gearboxOutputRpm,
                internalGearboxRatio: customMotorInput.planetaryRatio,
              }));
            }}
          />
        )}

        {activeTab === 'budget200' && (
          <BudgetLocomotiveBuilder
            isBudget200Active={selectedMotorId === 'motor-parafusadeira-12v'}
            specs={specs}
            onActivateBudget200={({ specs: nextSpecs, transmission: nextTrans, ratedRpm, ratedTorqueNm, stallTorqueNm }) => {
              const base = MOTOR_OPTIONS.find((m) => m.id === 'motor-parafusadeira-12v') || MOTOR_OPTIONS[0];
              setCustomBudgetMotor({
                ...base,
                ratedRpm,
                ratedTorque: ratedTorqueNm,
                stallTorque: stallTorqueNm,
              });
              setSelectedMotorId('motor-parafusadeira-12v');
              setSpecs(nextSpecs);
              setTransmission(nextTrans);
            }}
          />
        )}

        {activeTab === 'simulator' && (
          <CompetitionSimulators
            specs={specs}
            transmission={transmission}
            selectedMotor={selectedMotor}
          />
        )}

        {activeTab === 'regulation' && (
          <RegulationChecklist specs={specs} />
        )}

        {activeTab === 'print3d' && (
          <Print3DSpecs />
        )}

        {activeTab === 'report' && (
          <TechnicalReport specs={specs} transmission={transmission} />
        )}

        {activeTab === 'gallery' && (
          <CadReferenceGallery />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300">Desafio Universitário de Ferromodelismo Cavalos de Ferro 2026</span>
            <span>•</span>
            <span>
              Referência:{' '}
              <a
                href="/assets/aistudio/Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf"
                download="Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf"
                className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 font-mono"
              >
                Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
              </a>
            </span>
          </div>
          <div>
            Bitola 150 mm • Engrenagens M1.0 • Correia Síncrona GT2 • Impressão 3D
          </div>
        </div>
      </footer>

      {/* Full Project PDF Export Modal */}
      <FullProjectPdfExport
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        specs={specs}
        transmission={transmission}
        selectedMotor={selectedMotor}
      />
    </div>
  );
}
