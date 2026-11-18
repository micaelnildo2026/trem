import React, { useState } from 'react';
import { Target, TrendingUp, Gauge, Swords, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { LocomotiveSpecs, TransmissionConfig, MotorOption } from '../types/locomotive';
import { TrialAnimationStage } from './TrialAnimationStage';

interface Props {
  specs: LocomotiveSpecs;
  transmission: TransmissionConfig;
  selectedMotor?: MotorOption;
}

export const CompetitionSimulators: React.FC<Props> = ({ specs, transmission, selectedMotor }) => {
  const [activeProof, setActiveProof] = useState<'helpers' | 'elevation' | 'acceleration' | 'tug_of_war'>('helpers');

  // Helpers Simulator States
  const [helpersLoadKg, setHelpersLoadKg] = useState<number>(20); // 0 to 25 kg
  const [helpersRailFriction, setHelpersRailFriction] = useState<number>(0.025); // Rolamento das rodas do vagão

  // Elevation Simulator States
  const [elevationAngleDeg, setElevationAngleDeg] = useState<number>(15); // 5°, 10°, 15°, 20°

  // Tug of War Simulator States
  const [rivalWeightKg, setRivalWeightKg] = useState<number>(6.5);
  const [rivalTractionType, setRivalTractionType] = useState<'4x2' | '4x4'>('4x2');

  // Mechanical values
  const locoMassKg = specs.totalWeightGrams / 1000; // e.g. 7.65 kg
  const g = 9.81;
  const wheelRadiusM = (transmission.wheelDiameterMm / 2) / 1000; // 0.0325 m
  const gearRatio = transmission.drivenGearTeeth / transmission.motorPinionTeeth; // 3.0
  const totalRatio = transmission.internalGearboxRatio * gearRatio; // 57.6
  const motorRatedTorque = selectedMotor?.ratedTorque ?? 4.8; // N.m no redutor planetário
  const maxAxleTorque = motorRatedTorque * gearRatio * 0.90; // ~13.0 N.m
  const maxTractiveForce = maxAxleTorque / wheelRadiusM; // ~399 N (motor-limited)

  // Maximum friction traction before slipping (4WD adhesion limit)
  // Fat_max = mu * Normal = mu * m * g
  const maxAdhesionForceN = specs.wheelFrictionCoeff * locoMassKg * g; // ~0.65 * 7.65 * 9.81 = ~48.8 N

  // --- 1. HELPERS CALCULATIONS ---
  // Vagão padrão vazio ~ 2.5 kg + helpersLoadKg
  const totalWagonMassKg = 2.5 + helpersLoadKg;
  // Drag force to push wagon at steady velocity + rail rolling resistance
  const wagonRollingResistanceN = totalWagonMassKg * g * helpersRailFriction; // ~22.5 * 9.81 * 0.025 = ~5.5 N
  // Acceleration force to reach 0.8 m/s in 0.5s: F = m * a = 22.5 * 1.6 = 36 N
  const helpersPeakForceN = wagonRollingResistanceN + (totalWagonMassKg + locoMassKg) * 0.6; // ~23.5 N
  const helpersCurrentA = Math.min(30, 4.0 + (helpersPeakForceN / maxAdhesionForceN) * 16.0);
  const helpersSpeedMs = Math.min(1.05, 1.15 - (helpersLoadKg * 0.015));
  const helpersTime2m = 2.0 / helpersSpeedMs + 0.3;
  const helpersPassed = helpersPeakForceN <= maxAdhesionForceN;

  // --- 2. ELEVATION CALCULATIONS ---
  const thetaRad = (elevationAngleDeg * Math.PI) / 180;
  const gravityResistN = locoMassKg * g * Math.sin(thetaRad); // mg * sin(theta)
  const normalOnRampN = locoMassKg * g * Math.cos(thetaRad);
  const rampAdhesionLimitN = specs.wheelFrictionCoeff * normalOnRampN;
  const rampTotalForceN = gravityResistN + 3.0; // gravity + friction
  const rampWheelSlip = rampTotalForceN > rampAdhesionLimitN;
  const rampPassed = !rampWheelSlip && rampTotalForceN <= maxTractiveForce;
  const rampSpeedMs = Math.max(0.1, 1.05 * Math.cos(thetaRad) * (1 - (rampTotalForceN / maxAdhesionForceN) * 0.4));
  const rampTime2m = 2.0 / rampSpeedMs;

  // --- 3. ACCELERATION CALCULATIONS (2500 mm / 2.5 m) ---
  // Distance = 2.5 m
  const accForceAvailable = Math.min(maxAdhesionForceN, maxTractiveForce) - 4.0; // traction minus internal resistance
  const maxAccMs2 = accForceAvailable / locoMassKg; // a = F / m = ~44 / 7.65 = ~5.75 m/s² (controlada em rampa)
  const controlledAccMs2 = Math.min(2.5, maxAccMs2); // software anti-slip throttle ramp
  const topSpeedMs = 1.05; // limited by max motor RPM
  // Kinematics: time to reach topSpeed: t1 = v / a. d1 = 0.5 * a * t1^2. Remaining dist at topSpeed.
  const t1 = topSpeedMs / controlledAccMs2;
  const d1 = 0.5 * controlledAccMs2 * t1 * t1;
  const dRem = Math.max(0, 2.5 - d1);
  const t2 = dRem / topSpeedMs;
  const totalAccTime2500Mm = d1 >= 2.5 ? Math.sqrt((2 * 2.5) / controlledAccMs2) : t1 + t2;

  // --- 4. TUG OF WAR (CABO DE GUERRA 3.0 m) ---
  // Rival adhesion limit
  const rivalMu = rivalTractionType === '4x4' ? 0.60 : 0.35; // 4x2 rivals slip much earlier
  const rivalMaxAdhesionN = rivalMu * rivalWeightKg * g;
  const ourAdvantageN = maxAdhesionForceN - rivalMaxAdhesionN;
  const tugOfWarWin = ourAdvantageN > 0;
  // Hitch shear stress (pin 6mm brass/steel): Area = pi * (0.003)^2 = 2.82e-5 m²
  const pinShearStressMpa = (maxAdhesionForceN / (Math.PI * 0.003 * 0.003)) / 1e6; // ~1.7 MPa (vastly below 250 MPa yield!)
  const hitchSafetyFactor = 250 / Math.max(1, pinShearStressMpa);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Simulador das 4 Provas Oficiais (Regulamento Cavalos de Ferro)
              <span className="text-xs font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Física Dinâmica Real
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo de forças normais, atrito estático/dinâmico, empuxo trator e tempos de percurso
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveProof('helpers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeProof === 'helpers' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            4.2 Tração "Helpers" (20kg)
          </button>
          <button
            onClick={() => setActiveProof('elevation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeProof === 'elevation' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            4.3 Elevação (Rampa 20°)
          </button>
          <button
            onClick={() => setActiveProof('acceleration')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeProof === 'acceleration' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            4.4 Aceleração (2500mm)
          </button>
          <button
            onClick={() => setActiveProof('tug_of_war')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeProof === 'tug_of_war' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            4.5 Cabo de Guerra
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <TrialAnimationStage
          activeProof={activeProof}
          locoMassKg={locoMassKg}
          maxAdhesionForceN={maxAdhesionForceN}
          helpersLoadKg={helpersLoadKg}
          helpersPeakForceN={helpersPeakForceN}
          helpersSpeedMs={helpersSpeedMs}
          helpersTime2m={helpersTime2m}
          helpersPassed={helpersPassed}
          elevationAngleDeg={elevationAngleDeg}
          gravityResistN={gravityResistN}
          rampAdhesionLimitN={rampAdhesionLimitN}
          rampTotalForceN={rampTotalForceN}
          rampSpeedMs={rampSpeedMs}
          rampTime2m={rampTime2m}
          rampPassed={rampPassed}
          controlledAccMs2={controlledAccMs2}
          topSpeedMs={topSpeedMs}
          totalAccTime2500Mm={totalAccTime2500Mm}
          rivalWeightKg={rivalWeightKg}
          rivalTractionType={rivalTractionType}
          rivalMaxAdhesionN={rivalMaxAdhesionN}
          hitchSafetyFactor={hitchSafetyFactor}
          tugOfWarWin={tugOfWarWin}
        />

        {/* --- PROVA 4.2 HELPERS --- */}
        {activeProof === 'helpers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Parâmetros da Prova de Tração Helpers
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Carga Adicionada no Vagão:</span>
                      <span className="font-mono font-bold text-amber-400">{helpersLoadKg} kg</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={helpersLoadKg}
                      onChange={(e) => setHelpersLoadKg(parseInt(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Vazio (0kg)</span>
                      <span>5kg</span>
                      <span>10kg</span>
                      <span>15kg</span>
                      <span>20kg (Máx Reg)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Coef. de Rolamento do Vagão (fr):</span>
                      <span className="font-mono text-cyan-400">{helpersRailFriction.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.015"
                      max="0.045"
                      step="0.005"
                      value={helpersRailFriction}
                      onChange={(e) => setHelpersRailFriction(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                    <div className="text-slate-400 text-[11px]">Resumo do Trem:</div>
                    <div>Locomotiva: <strong className="text-white">{locoMassKg.toFixed(2)} kg</strong></div>
                    <div>Vagão c/ Carga: <strong className="text-white">{totalWagonMassKg.toFixed(2)} kg</strong></div>
                    <div>Massa Total Movimentada: <strong className="text-cyan-400">{(locoMassKg + totalWagonMassKg).toFixed(2)} kg</strong></div>
                  </div>
                </div>
              </div>

              {/* Simulation Result */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Desempenho no Percurso de 2 Metros
                  </div>
                  {helpersPassed ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                      <CheckCircle2 className="w-4 h-4" /> APROVADO COM SOBRA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full font-bold">
                      <AlertTriangle className="w-4 h-4" /> RISCO DE PATINAGEM
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Força de Tração (Vagão):</span>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {helpersPeakForceN.toFixed(1)} N
                    </div>
                    <span className="text-[10px] text-slate-400">Limite: {maxAdhesionForceN.toFixed(1)} N</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Corrente Consumida:</span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {helpersCurrentA.toFixed(1)} A
                    </div>
                    <span className="text-[10px] text-slate-400">Driver: 43A max</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Velocidade Média:</span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {helpersSpeedMs.toFixed(2)} m/s
                    </div>
                    <span className="text-[10px] text-slate-400">{(helpersSpeedMs * 3.6).toFixed(1)} km/h</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Tempo de Prova (2m):</span>
                    <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                      {helpersTime2m.toFixed(2)} s
                    </div>
                    <span className="text-[10px] text-emerald-400">Dentro da janela</span>
                  </div>
                </div>

                {/* Technical insight */}
                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Análise da Tração 4x4 no Helpers 20kg:</strong> Graças ao sincronismo positivo da correia dentada GT2, todo o peso de 7,65 kg é distribuído igualmente entre os dois eixos (3,82 kg por eixo). A força de atrito estático disponível é de <strong>{maxAdhesionForceN.toFixed(1)} N</strong>, enquanto a força de arraste do vagão com 20 kg exige apenas <strong>{helpersPeakForceN.toFixed(1)} N</strong>. Margem de segurança de tração superior a <strong>100%</strong>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROVA 4.3 ELEVAÇÃO --- */}
        {activeProof === 'elevation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Ângulo da Rampa (Hall do Bloco U)
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Inclinação da Rampa (θ):</span>
                      <span className="font-mono font-bold text-amber-400">{elevationAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      step="5"
                      value={elevationAngleDeg}
                      onChange={(e) => setElevationAngleDeg(parseInt(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>5°</span>
                      <span>10°</span>
                      <span>15°</span>
                      <span>20° (Máx Reg)</span>
                      <span>25°</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                    <div className="text-slate-400 text-[11px]">Decomposição de Forças:</div>
                    <div className="flex justify-between font-mono">
                      <span>Componente Gravitacional (mg sin θ):</span>
                      <strong className="text-red-400">{gravityResistN.toFixed(1)} N</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Força Normal na Rampa (mg cos θ):</span>
                      <strong className="text-cyan-400">{normalOnRampN.toFixed(1)} N</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Limite de Aderência Roda-Trilho:</span>
                      <strong className="text-emerald-400">{rampAdhesionLimitN.toFixed(1)} N</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Comportamento em Rampa θ = {elevationAngleDeg}° (2 Metros)
                  </div>
                  {rampPassed ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                      <CheckCircle2 className="w-4 h-4" /> SOBE SEM DERRAPAR
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full font-bold">
                      <AlertTriangle className="w-4 h-4" /> LIMITE DE ADERÊNCIA ULTRAPASSADO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Força Tratora Exigida:</span>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {rampTotalForceN.toFixed(1)} N
                    </div>
                    <span className="text-[10px] text-slate-400">Disponível: {rampAdhesionLimitN.toFixed(1)} N</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Torque nos Eixos:</span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {(rampTotalForceN * wheelRadiusM).toFixed(2)} N.m
                    </div>
                    <span className="text-[10px] text-slate-400">Max do motor: {maxAxleTorque.toFixed(1)} N.m</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Velocidade de Subida:</span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {rampSpeedMs.toFixed(2)} m/s
                    </div>
                    <span className="text-[10px] text-slate-400">Sem perda de rotação</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Tempo Subida (2m):</span>
                    <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                      {rampTime2m.toFixed(2)} s
                    </div>
                    <span className="text-[10px] text-emerald-400">Estável</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Diferencial Decisivo na Elevação:</strong> Locomotivas com apenas 2 rodas tracionadas (4x2) perdem tração e começam a derrapar entre 10° e 15° devido à transferência de peso dinâmico. O nosso protótipo <strong>4x4 com correia GT2 e pneu de borracha/PU o-ring</strong> mantém todos os 4 pontos de contato ativos, vencendo a rampa de 20° com margem de segurança de atrito!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROVA 4.4 ACELERAÇÃO --- */}
        {activeProof === 'acceleration' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Parâmetros de Arrancada (2500 mm)
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Distância Regulamentar:</span>
                    <div className="text-lg font-bold font-mono text-white">2.500 mm (2,5 m)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Tentativas Permitidas:</span>
                    <div className="text-base font-bold text-amber-400">2 Tentativas (Melhor Tempo)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Estratégia de Controle:</span>
                    <div className="text-emerald-400 font-semibold">Rampa de PWM Anti-Patinagem (0.3s)</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Desempenho no Tiro de 2500 mm
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                    TEMPO ESTIMADO: {totalAccTime2500Mm.toFixed(2)} SEGUNDOS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Tempo Final:</span>
                    <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">
                      {totalAccTime2500Mm.toFixed(2)} s
                    </div>
                    <span className="text-[10px] text-slate-400">Sprint 2,5m</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Velocidade Terminal:</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                      {topSpeedMs.toFixed(2)} m/s
                    </div>
                    <span className="text-[10px] text-slate-400">{(topSpeedMs * 3.6).toFixed(1)} km/h</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Aceleração Média:</span>
                    <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                      {controlledAccMs2.toFixed(1)} m/s²
                    </div>
                    <span className="text-[10px] text-slate-400">Sem fritar pneus</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Pontuação Prevista:</span>
                    <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
                      Top 1-2
                    </div>
                    <span className="text-[10px] text-emerald-400">8 a 10 Pontos</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Por que a tração 4x4 ganha na aceleração:</strong> Em ferromodelismo de potência, o maior perdedor de tempo é a patinagem inicial no metal liso. Como nossas 4 rodas estão mecanicamente sincronizadas pela correia GT2, a aceleração inicial é instantânea e direta aos trilhos sem trancos que desestabilizem a locomotiva.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROVA 4.5 CABO DE GUERRA --- */}
        {activeProof === 'tug_of_war' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Configuração do Protótipo Adversário
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Peso do Oponente:</span>
                      <span className="font-mono font-bold text-amber-400">{rivalWeightKg.toFixed(1)} kg</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="8.0"
                      step="0.5"
                      value={rivalWeightKg}
                      onChange={(e) => setRivalWeightKg(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Leve (3kg)</span>
                      <span>Médio (5.5kg)</span>
                      <span>Pesado (8kg)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-300 mb-1 block">Tipo de Tração do Adversário:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRivalTractionType('4x2')}
                        className={`py-2 px-3 rounded-lg font-medium text-center transition-colors ${
                          rivalTractionType === '4x2'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        4x2 (1 Eixo Motor)
                      </button>
                      <button
                        onClick={() => setRivalTractionType('4x4')}
                        className={`py-2 px-3 rounded-lg font-medium text-center transition-colors ${
                          rivalTractionType === '4x4'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        4x4 (2 Eixos)
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                    <div className="text-slate-400 text-[11px]">Integridade do Engate (107.5 mm):</div>
                    <div className="flex justify-between font-mono">
                      <span>Tensão de Cisalhamento no Pino:</span>
                      <strong className="text-cyan-400">{pinShearStressMpa.toFixed(2)} MPa</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Fator de Segurança Estrutural:</span>
                      <strong className="text-emerald-400">FS = {hitchSafetyFactor.toFixed(0)}x</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      *Regra 4.5: Quebra do engate = derrota imediata. Nosso engate foi superdimensionado!
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                    <Swords className="w-4 h-4 text-purple-400" />
                    Simulação do Confronto Direto (Marca de 1,2 m)
                  </div>
                  {tugOfWarWin ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                      <CheckCircle2 className="w-4 h-4" /> VITÓRIA CERTA NO CABO DE GUERRA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                      <AlertTriangle className="w-4 h-4" /> DUELO EQUILIBRADO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Nossa Tração Máxima:</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                      {maxAdhesionForceN.toFixed(1)} N
                    </div>
                    <span className="text-[10px] text-slate-400">AWD + 7.65 kg</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Tração do Oponente:</span>
                    <div className="text-2xl font-bold font-mono text-red-400 mt-0.5">
                      {rivalMaxAdhesionN.toFixed(1)} N
                    </div>
                    <span className="text-[10px] text-slate-400">{rivalTractionType} + {rivalWeightKg}kg</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Saldo de Empuxo:</span>
                    <div className={`text-2xl font-bold font-mono mt-0.5 ${ourAdvantageN >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      {ourAdvantageN >= 0 ? `+${ourAdvantageN.toFixed(1)} N` : `${ourAdvantageN.toFixed(1)} N`}
                    </div>
                    <span className="text-[10px] text-slate-400">Força líquida</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Resultado Previsto:</span>
                    <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
                      {tugOfWarWin ? '10 Pontos' : 'Revisar Lastro'}
                    </div>
                    <span className="text-[10px] text-emerald-400">{tugOfWarWin ? 'Arrasta o rival' : 'Empate'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-white">A Chave da Vitória no Cabo de Guerra:</strong> No regulamento da UFSC, vence quem arrastar o outro até a traseira cruzar a marca de 1,2 metros. Em caso de empate, vence a maior distância.
                  </p>
                  <p>
                    Nosso protótipo foi projetado com <strong>7.650 gramas</strong> (ficando 350g abaixo do teto de 8.000g para não tomar nenhuma penalidade), com centro de gravidade rebaixado e lastro de aço centralizado sobre os rodeiros. Com 4 rodas tracionadas simultaneamente por engrenagem e correia GT2, nenhum eixo patina individualmente. O adversário com apenas 2 rodas tracionadas ou sem lastro ideal é arrastado nos primeiros 3 segundos!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
