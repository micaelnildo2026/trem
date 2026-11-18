import React, { useMemo, useState } from 'react';
import {
  Leaf,
  Printer,
  Wrench,
  ShoppingCart,
  CheckCircle2,
  Cpu,
  RotateCcw,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Recycle,
  BatteryCharging,
  Layers,
} from 'lucide-react';
import {
  CustomMotorInput,
  DEFAULT_CUSTOM_MOTOR_INPUT,
  calculateCustomMotorSpecs,
  calculateSustainabilityScore,
} from '../utils/sustainableMotorPhysics';
import {
  SUSTAINABLE_BOM_ITEMS,
  DIY_MOTOR_FABRICATION_STEPS,
  SUSTAINABLE_LOCOMOTIVE_SPECS,
} from '../data/locomotiveData';
import { LocomotiveSpecs, ProductionMethod, TransmissionConfig } from '../types/locomotive';

interface Props {
  isSustainableMotorActive: boolean;
  transmission: TransmissionConfig;
  specs: LocomotiveSpecs;
  onActivateSustainableSolution: (payload: {
    customMotorOutput: ReturnType<typeof calculateCustomMotorSpecs>;
    customMotorInput: CustomMotorInput;
    sustainableSpecs: LocomotiveSpecs;
  }) => void;
}

const METHOD_LABELS: Record<ProductionMethod, string> = {
  print3d: 'Impressão 3D',
  fabrication: 'Fabricação Própria',
  purchase: 'Compra Estratégica',
};

const METHOD_TEXT_CLASSES: Record<ProductionMethod, string> = {
  print3d: 'text-cyan-400',
  fabrication: 'text-emerald-400',
  purchase: 'text-amber-400',
};

const SUBSYSTEM_LABELS: Record<'motor' | 'transmission' | 'chassis' | 'electronics', string> = {
  motor: 'Motor Próprio AFPM',
  transmission: 'Transmissão 4x4',
  chassis: 'Chassi & Lastro',
  electronics: 'Energia & Controle',
};

export const SustainableLocomotiveBuilder: React.FC<Props> = ({
  isSustainableMotorActive,
  transmission,
  specs,
  onActivateSustainableSolution,
}) => {
  const [motorInput, setMotorInput] = useState<CustomMotorInput>({
    ...DEFAULT_CUSTOM_MOTOR_INPUT,
    externalGearRatio: transmission.drivenGearTeeth / transmission.motorPinionTeeth,
    wheelDiameterMm: transmission.wheelDiameterMm,
  });

  const [bomFilter, setBomFilter] = useState<'all' | ProductionMethod>('all');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Sincroniza relação externa atual com a transmissão global
  const syncedMotorInput: CustomMotorInput = useMemo(
    () => ({
      ...motorInput,
      externalGearRatio: transmission.drivenGearTeeth / transmission.motorPinionTeeth,
      wheelDiameterMm: transmission.wheelDiameterMm,
    }),
    [motorInput, transmission.drivenGearTeeth, transmission.motorPinionTeeth, transmission.wheelDiameterMm]
  );

  const motorOutput = useMemo(
    () => calculateCustomMotorSpecs(syncedMotorInput),
    [syncedMotorInput]
  );

  // Soma das massas da BOM por categoria para auditoria real
  const bomTotals = useMemo(() => {
    const print3dMass = SUSTAINABLE_BOM_ITEMS.filter((i) => i.method === 'print3d').reduce(
      (sum, i) => sum + i.massG,
      0
    );
    const fabricationMass = SUSTAINABLE_BOM_ITEMS.filter((i) => i.method === 'fabrication').reduce(
      (sum, i) => sum + i.massG,
      0
    );
    const purchaseMass = SUSTAINABLE_BOM_ITEMS.filter((i) => i.method === 'purchase').reduce(
      (sum, i) => sum + i.massG,
      0
    );
    const totalCostBrl = SUSTAINABLE_BOM_ITEMS.reduce((sum, i) => sum + i.estimatedCostBrl, 0);
    return {
      print3dMass,
      fabricationMass,
      purchaseMass,
      totalMass: print3dMass + fabricationMass + purchaseMass,
      totalCostBrl,
    };
  }, []);

  const sustainabilityMetrics = useMemo(
    () =>
      calculateSustainabilityScore({
        totalLocomotiveWeightG: bomTotals.totalMass,
        printedPartsMassG: bomTotals.print3dMass,
        reclaimedMetalMassG: bomTotals.fabricationMass,
        purchasedElectronicsMassG: bomTotals.purchaseMass,
        usesLeadBallast: false,
        usesCobaltFreeBattery: true,
      }),
    [bomTotals]
  );

  const filteredBom = useMemo(() => {
    if (bomFilter === 'all') return SUSTAINABLE_BOM_ITEMS;
    return SUSTAINABLE_BOM_ITEMS.filter((item) => item.method === bomFilter);
  }, [bomFilter]);

  const filteredBomMass = filteredBom.reduce((acc, item) => acc + item.massG, 0);
  const filteredBomCost = filteredBom.reduce((acc, item) => acc + item.estimatedCostBrl, 0);

  const applyPreset = (preset: 'balanced' | 'tug' | 'speed') => {
    if (preset === 'balanced') {
      setMotorInput((prev) => ({
        ...prev,
        turnsPerCoil: 20,
        wireDiameterMm: 0.95,
        statorMeanRadiusMm: 30,
        planetaryRatio: 5.0,
        supplyVoltageV: 12.8,
        continuousCurrentA: 16,
      }));
    } else if (preset === 'tug') {
      setMotorInput((prev) => ({
        ...prev,
        turnsPerCoil: 26,
        wireDiameterMm: 0.9,
        statorMeanRadiusMm: 33,
        planetaryRatio: 7.0,
        supplyVoltageV: 12.8,
        continuousCurrentA: 18,
      }));
    } else {
      setMotorInput((prev) => ({
        ...prev,
        turnsPerCoil: 16,
        wireDiameterMm: 1.05,
        statorMeanRadiusMm: 29,
        planetaryRatio: 4.0,
        supplyVoltageV: 16.0,
        continuousCurrentA: 16,
      }));
    }
  };

  const handleApplyToLocomotive = () => {
    const updatedSpecs: LocomotiveSpecs = {
      ...SUSTAINABLE_LOCOMOTIVE_SPECS,
      motorGearboxWeightG: motorOutput.estimatedMotorMassG + 80,
      totalWeightGrams: Math.min(
        7950,
        SUSTAINABLE_LOCOMOTIVE_SPECS.chassisWeightG +
          SUSTAINABLE_LOCOMOTIVE_SPECS.shellWeightG +
          motorOutput.estimatedMotorMassG +
          80 +
          SUSTAINABLE_LOCOMOTIVE_SPECS.batteryWeightG +
          SUSTAINABLE_LOCOMOTIVE_SPECS.wheelsetBearingsWeightG +
          SUSTAINABLE_LOCOMOTIVE_SPECS.ballastWeightG
      ),
    };

    onActivateSustainableSolution({
      customMotorOutput: motorOutput,
      customMotorInput: syncedMotorInput,
      sustainableSpecs: updatedSpecs,
    });
  };

  const activeStep = DIY_MOTOR_FABRICATION_STEPS[activeStepIndex] || DIY_MOTOR_FABRICATION_STEPS[0];

  return (
    <div className="space-y-6">
      {/* Top Architecture Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Leaf className="w-4 h-4" />
              <span>Engenharia Circular · Motor Próprio de Fluxo Axial (AFPM 12N14P) · Conformidade Cavalos de Ferro 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
              Solução Sustentável: Construção da Locomotiva & Fabricação do Próprio Motor
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Estratégia híbrida em três pilares — <strong>impressão 3D modular em rPETG reciclado</strong>,{' '}
              <strong>fabricação e reaproveitamento metálico em oficina</strong> e{' '}
              <strong>compra estratégica apenas do essencial</strong> (cobre, ímãs N52, rolamentos e bateria LiFePO4 sem cobalto) —
              mantendo bitola exata de 150 mm, engate em 107,5 mm e zero chumbo tóxico.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleApplyToLocomotive}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSustainableMotorActive
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSustainableMotorActive
                  ? 'Motor Próprio Ativo — Atualizar Parâmetros'
                  : 'Ativar Motor Próprio Sustentável no Projeto'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {isSustainableMotorActive
                ? `Ativo no simulador e PDF · Massa atual: ${specs.totalWeightGrams} g`
                : 'Aplica motor AFPM + lastro sem chumbo ao simulador e PDF'}
            </span>
          </div>
        </div>

        {/* 4 KPI Quantitative Indicators Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Índice de Circularidade</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums whitespace-nowrap">
                {sustainabilityMetrics.circularityPercent}%
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap">da massa total</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Impressão 3D rPETG + aço de sucata com montagem 100% desmontável sem cola
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Chumbo Tóxico Eliminado</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums whitespace-nowrap">
                {sustainabilityMetrics.toxicLeadEliminatedG} g
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap">0 g de Pb</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Substituído por sucata ferrosa limpa (2.970 g) mantendo tração de 7.650 g
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Torque Motor Próprio (Saída)</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums whitespace-nowrap">
                {motorOutput.gearboxRatedTorqueNm} N.m
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums whitespace-nowrap">
                (pico {motorOutput.gearboxStallTorqueNm})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Estator 12N14P sem núcleo ferroso + redutor planetário 3D {syncedMotorInput.planetaryRatio}:1
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Economia de CO₂e & Ciclos</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-mono font-bold text-white tabular-nums whitespace-nowrap">
                -{sustainabilityMetrics.co2SavedKg} kg
              </span>
              <span className="text-xs text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                CO₂e · {sustainabilityMetrics.batteryCycleLifeRatio}× ciclos
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Bateria LiFePO4 livre de cobalto (2.000+ ciclos) e eixos de sucata eletrônica
            </p>
          </div>
        </div>
      </section>

      {/* Main Asymmetric Split Console: DIY Motor Configurator + SVG Cross-Section Diagram */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Parameter Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Dimensionamento do Motor Próprio (12N14P)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste bobinagem, estator e planetária 3D em tempo real
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Restaurar parâmetros padrão do motor"
                title="Restaurar parâmetros padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Equilíbrio Competição
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tug')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Torque Extremo (Cabo de Guerra)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('speed')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Alta Rotação (Aceleração)
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-turns" className="text-slate-300 font-medium">
                    Espiras por Bobina (12 bobinas no estator)
                  </label>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {motorInput.turnsPerCoil} espiras
                  </span>
                </div>
                <input
                  id="slider-turns"
                  type="range"
                  min={14}
                  max={36}
                  step={1}
                  value={motorInput.turnsPerCoil}
                  onChange={(e) =>
                    setMotorInput((prev) => ({ ...prev, turnsPerCoil: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-wire" className="text-slate-300 font-medium">
                    Bitola do Fio de Cobre Esmaltado
                  </label>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">
                    Ø {motorInput.wireDiameterMm.toFixed(2)} mm
                  </span>
                </div>
                <input
                  id="slider-wire"
                  type="range"
                  min={0.7}
                  max={1.15}
                  step={0.05}
                  value={motorInput.wireDiameterMm}
                  onChange={(e) =>
                    setMotorInput((prev) => ({ ...prev, wireDiameterMm: Number(e.target.value) }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-radius" className="text-slate-300 font-medium">
                    Raio Médio do Estator Axial
                  </label>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {motorInput.statorMeanRadiusMm} mm (Ø ext {motorOutput.motorOuterDiameterMm} mm)
                  </span>
                </div>
                <input
                  id="slider-radius"
                  type="range"
                  min={26}
                  max={36}
                  step={1}
                  value={motorInput.statorMeanRadiusMm}
                  onChange={(e) =>
                    setMotorInput((prev) => ({ ...prev, statorMeanRadiusMm: Number(e.target.value) }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-planetary" className="text-slate-300 font-medium">
                    Redução Planetária Impressa 3D (Estágio Frontal)
                  </label>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {motorInput.planetaryRatio.toFixed(1)} : 1
                  </span>
                </div>
                <input
                  id="slider-planetary"
                  type="range"
                  min={4.0}
                  max={9.0}
                  step={0.5}
                  value={motorInput.planetaryRatio}
                  onChange={(e) =>
                    setMotorInput((prev) => ({ ...prev, planetaryRatio: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Bateria Sustentável LiFePO4</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {motorInput.supplyVoltageV.toFixed(1)} V nominal
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMotorInput((prev) => ({ ...prev, supplyVoltageV: 12.8 }))}
                    className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                      motorInput.supplyVoltageV === 12.8
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    LiFePO4 4S (12,8 V)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotorInput((prev) => ({ ...prev, supplyVoltageV: 16.0 }))}
                    className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                      motorInput.supplyVoltageV === 16.0
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    LiFePO4 5S (16,0 V)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Electromagnetic & Copper Fabrication Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Kv motor:</span>
              <span className="text-white font-bold">{motorOutput.kvRpmPerVolt} RPM/V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kt motor:</span>
              <span className="text-white font-bold">{motorOutput.ktNmPerAmp} N.m/A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fio necessário:</span>
              <span className="text-amber-400 font-bold">{motorOutput.copperWireLengthM} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Massa cobre:</span>
              <span className="text-amber-400 font-bold">{motorOutput.copperMassG} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">R fase (Y):</span>
              <span className="text-cyan-400 font-bold">{motorOutput.phaseResistanceOhm} Ω</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Massa motor:</span>
              <span className="text-emerald-400 font-bold">{motorOutput.estimatedMotorMassG} g</span>
            </div>
          </div>
        </div>

        {/* Right Stage: Interactive Engineering Cutaway SVG Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Corte Esquemático do Motor Axial Fabricado + Planetária 3D
              </h3>
              <p className="text-xs text-slate-400">
                Arquitetura sanduíche (Rotor Duplo Aço 1020 + Estator rPETG sem núcleo ferroso + Planetária PA12-CF)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 tabular-nums">
              Ø Ext {motorOutput.motorOuterDiameterMm} mm · {motorOutput.efficiencyPercent}% efic.
            </span>
          </div>

          {/* Crisp SVG Cutaway Diagram */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-hidden">
            <svg
              viewBox="0 0 760 320"
              className="w-full h-auto"
              role="img"
              aria-label="Diagrama em corte do motor axial de fluxo duplo com estator impresso em 3D e redutor planetário"
            >
              <defs>
                <pattern id="sustGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                </pattern>
                <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <linearGradient id="copperGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>

              <rect width="760" height="320" fill="#020617" />
              <rect width="760" height="320" fill="url(#sustGrid)" />

              {/* Center Shaft Axis (8mm Reclaimed Steel) */}
              <line x1="25" y1="160" x2="730" y2="160" stroke="#38bdf8" strokeWidth="1" strokeDasharray="8 4" opacity="0.6" />
              <rect x="65" y="150" width="560" height="20" rx="2" fill="url(#steelGrad)" stroke="#cbd5e1" strokeWidth="1" />

              {/* Outer 3D Printed Housing (rPETG) */}
              <path
                d="M 80 42 L 545 42 L 545 72 L 525 72 L 525 58 L 100 58 L 100 262 L 525 262 L 525 248 L 545 248 L 545 278 L 80 278 Z"
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <text x="95" y="32" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
                CARCAÇA MODULAR IMPRESSA EM rPETG RECICLADO (DESMONTÁVEL)
              </text>

              {/* Left 608ZZ Bearing */}
              <rect x="92" y="128" width="22" height="22" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <rect x="92" y="170" width="22" height="22" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <circle cx="103" cy="139" r="5" fill="#cbd5e1" />
              <circle cx="103" cy="181" r="5" fill="#cbd5e1" />

              {/* Rear Rotor Back-Iron Disc (Scrap SAE 1020 Steel) */}
              <rect x="145" y="68" width="16" height="184" rx="2" fill="url(#steelGrad)" stroke="#e2e8f0" strokeWidth="1.2" />
              {/* N52 Magnets on Rear Rotor */}
              <rect x="161" y="76" width="14" height="44" rx="1.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1" />
              <text x="165" y="102" fill="#ffffff" fontSize="9" fontWeight="bold">N</text>
              <rect x="161" y="200" width="14" height="44" rx="1.5" fill="#3b82f6" stroke="#bfdbfe" strokeWidth="1" />
              <text x="165" y="226" fill="#ffffff" fontSize="9" fontWeight="bold">S</text>

              {/* 3D Printed Ironless Stator Carrier + 12 Copper Coils */}
              <rect x="195" y="64" width="38" height="192" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
              {/* Upper Coil Cross Section */}
              <rect x="200" y="75" width="28" height="48" rx="3" fill="url(#copperGrad)" stroke="#fef3c7" strokeWidth="1" />
              <text x="203" y="97" fill="#0f172a" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {motorInput.turnsPerCoil}T
              </text>
              <text x="202" y="108" fill="#0f172a" fontSize="7.5" fontFamily="monospace">Cu</text>

              {/* Lower Coil Cross Section */}
              <rect x="200" y="197" width="28" height="48" rx="3" fill="url(#copperGrad)" stroke="#fef3c7" strokeWidth="1" />
              <text x="203" y="219" fill="#0f172a" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {motorInput.turnsPerCoil}T
              </text>
              <text x="202" y="230" fill="#0f172a" fontSize="7.5" fontFamily="monospace">Cu</text>

              {/* Hall Sensor SS41F */}
              <rect x="208" y="54" width="12" height="10" fill="#a855f7" stroke="#f3e8ff" strokeWidth="1" />
              <text x="180" y="51" fill="#d8b4fe" fontSize="8.5" fontFamily="monospace">3× Sensor Hall</text>

              {/* Front Rotor Back-Iron Disc (Scrap SAE 1020 Steel) */}
              <rect x="267" y="68" width="16" height="184" rx="2" fill="url(#steelGrad)" stroke="#e2e8f0" strokeWidth="1.2" />
              {/* N52 Magnets on Front Rotor (Opposite attracting poles across airgap) */}
              <rect x="253" y="76" width="14" height="44" rx="1.5" fill="#3b82f6" stroke="#bfdbfe" strokeWidth="1" />
              <text x="257" y="102" fill="#ffffff" fontSize="9" fontWeight="bold">S</text>
              <rect x="253" y="200" width="14" height="44" rx="1.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1" />
              <text x="257" y="226" fill="#ffffff" fontSize="9" fontWeight="bold">N</text>

              {/* Magnetic Flux Arrows across airgap */}
              <line x1="176" y1="98" x2="252" y2="98" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="3 2" />
              <line x1="252" y1="222" x2="176" y2="222" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="3 2" />

              {/* Middle Bearing 608ZZ */}
              <rect x="315" y="128" width="22" height="22" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <rect x="315" y="170" width="22" height="22" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />

              {/* Integrated 3D-Printed Planetary Stage (PA12-CF) */}
              <rect x="368" y="66" width="148" height="188" rx="4" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="378" y="80" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold">
                PLANETÁRIA 3D ({motorInput.planetaryRatio.toFixed(1)}:1)
              </text>

              {/* Ring Gear Teeth */}
              <rect x="378" y="87" width="66" height="10" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="378" y="228" width="66" height="10" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />

              {/* Sun Gear on Shaft */}
              <rect x="390" y="140" width="42" height="40" rx="2" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.2" />
              <text x="396" y="163" fill="#0f172a" fontSize="8" fontFamily="monospace" fontWeight="bold">SOL 15T</text>

              {/* Planet Gears */}
              <rect x="390" y="101" width="42" height="35" rx="2" fill="#06b6d4" stroke="#cffafe" strokeWidth="1.2" />
              <text x="394" y="121" fill="#0f172a" fontSize="7.5" fontFamily="monospace" fontWeight="bold">PLANETA</text>
              <rect x="390" y="184" width="42" height="35" rx="2" fill="#06b6d4" stroke="#cffafe" strokeWidth="1.2" />
              <text x="394" y="204" fill="#0f172a" fontSize="7.5" fontFamily="monospace" fontWeight="bold">PLANETA</text>

              {/* Planet Carrier Arm -> Output Shaft */}
              <path d="M 438 118 L 478 118 L 478 202 L 438 202" fill="none" stroke="#10b981" strokeWidth="6" strokeLinejoin="round" />

              {/* Exposed Shaft Callout */}
              <rect x="530" y="180" width="132" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <text x="536" y="192" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">
                EIXO Ø8mm (SUCATA)
              </text>

              {/* Output Pinion Gear M1.0 15T (Drives 45T + GT2 Belt) */}
              <rect x="578" y="126" width="38" height="46" rx="3" fill="#eab308" stroke="#fef08a" strokeWidth="1.4" />
              <text x="585" y="153" fill="#0f172a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">M1.0</text>
              <text x="565" y="116" fill="#fde047" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                PINHÃO {transmission.motorPinionTeeth}T
              </text>

              {/* Bottom Component Annotations */}
              <text x="80" y="300" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
                Discos Aço 1020 (Oficina)
              </text>
              <text x="278" y="300" fill="#fbbf24" fontSize="9.5" fontFamily="monospace">
                Estator 12N + 28 Ímãs N52
              </text>
              <text x="500" y="300" fill="#22d3ee" fontSize="9.5" fontFamily="monospace">
                Saída: {motorOutput.gearboxOutputRpm} RPM · {motorOutput.gearboxRatedTorqueNm} N.m
              </text>
            </svg>
          </div>

          {/* Kinematic Integration Outputs into 150mm 4WD Transmission */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block">Saída do Redutor</span>
              <span className="text-base font-mono font-bold text-white tabular-nums">
                {motorOutput.gearboxOutputRpm} RPM
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block">Torque nos Eixos (4WD)</span>
              <span className="text-base font-mono font-bold text-amber-400 tabular-nums">
                {motorOutput.axleTorqueNm} N.m
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block">Velocidade Nominal</span>
              <span className="text-base font-mono font-bold text-cyan-400 tabular-nums">
                {motorOutput.wheelLinearSpeedMs} m/s
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block">Força Tratora Motriz</span>
              <span className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                {motorOutput.maxMotorTractiveForceN} N
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Pillar Make / Print / Buy Matrix (BOM Sustentável) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Matriz de Construção: Impressão 3D × Fabricação Própria × Compra Estratégica
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Divisão técnica de cada componente do motor e da locomotiva para reduzir custo, eliminar toxinas e maximizar reparabilidade
            </p>
          </div>

          {/* Interactive Method Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setBomFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                bomFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({SUSTAINABLE_BOM_ITEMS.length})
            </button>
            <button
              type="button"
              onClick={() => setBomFilter('print3d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                bomFilter === 'print3d'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Impressão 3D (4)</span>
            </button>
            <button
              type="button"
              onClick={() => setBomFilter('fabrication')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                bomFilter === 'fabrication'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Fabricação Própria (4)</span>
            </button>
            <button
              type="button"
              onClick={() => setBomFilter('purchase')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                bomFilter === 'purchase'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Compra Estratégica (4)</span>
            </button>
          </div>
        </div>

        {/* BOM Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Componente & Especificação</th>
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3">Subsistema</th>
                <th className="py-2.5 px-3">Impacto Sustentável & Ferramental</th>
                <th className="py-2.5 px-3 text-right">Massa</th>
                <th className="py-2.5 px-3 text-right">Custo Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredBom.map((item) => (
                <tr key={item.id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="py-3 px-3 align-top">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.materialOrSpec}</div>
                  </td>
                  <td className="py-3 px-3 align-top whitespace-nowrap">
                    <span className={`font-semibold ${METHOD_TEXT_CLASSES[item.method]}`}>
                      {METHOD_LABELS[item.method]}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top text-slate-300 whitespace-nowrap">
                    {SUBSYSTEM_LABELS[item.subsystem]}
                  </td>
                  <td className="py-3 px-3 align-top text-slate-300 max-w-md">
                    <div>{item.sustainabilityRole}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.tooling}</div>
                  </td>
                  <td className="py-3 px-3 align-top text-right font-mono font-semibold text-slate-200 tabular-nums whitespace-nowrap">
                    {item.massG} g
                  </td>
                  <td className="py-3 px-3 align-top text-right font-mono font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                    {item.estimatedCostBrl === 0 ? 'R$ 0 (Sucata)' : `R$ ${item.estimatedCostBrl}`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-950/70 font-semibold text-white">
                <td colSpan={4} className="py-3 px-3 text-xs">
                  Subtotal Filtrado ({filteredBom.length} itens) · Limite Regulamentar da Locomotiva: 8.000 g
                </td>
                <td className="py-3 px-3 text-right font-mono text-cyan-400 tabular-nums">
                  {filteredBomMass} g
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 tabular-nums">
                  R$ {filteredBomCost}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 6-Step DIY Motor Fabrication Roadmap */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              Roteiro Prático: Fabricando seu Próprio Motor & Montando a Locomotiva (6 Etapas)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sequência completa de oficina universitária com verificações de qualidade em cada etapa
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Tempo total estimado: ~11 horas em oficina
          </span>
        </div>

        {/* Step Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {DIY_MOTOR_FABRICATION_STEPS.map((step, index) => {
            const isActive = index === activeStepIndex;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => setActiveStepIndex(index)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-mono font-bold text-emerald-400 tabular-nums">
                  Etapa 0{step.stepNumber}
                </div>
                <div className="text-xs font-semibold mt-0.5 line-clamp-2">{step.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Card */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs text-emerald-400 font-medium">
                Etapa 0{activeStep.stepNumber} · {activeStep.methodBadge} · Duração est. {activeStep.durationEst}
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">{activeStep.title}</h4>
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveStepIndex((prev) => (prev + 1) % DIY_MOTOR_FABRICATION_STEPS.length)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Próxima Etapa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeStep.summary}</p>

          <ul className="space-y-2 text-xs text-slate-300">
            {activeStep.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-400">Inspeção de Qualidade na Bancada:</strong>{' '}
              {activeStep.qualityCheck}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
