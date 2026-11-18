import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Gauge, Zap } from 'lucide-react';
import {
  CompetitionProofId,
  evaluateHelpersFrame,
  evaluateElevationFrame,
  evaluateAccelerationFrame,
  evaluateTugOfWarFrame,
  TrialFrameState,
} from '../utils/trialAnimationPhysics';

interface Props {
  activeProof: CompetitionProofId;
  locoMassKg: number;
  maxAdhesionForceN: number;
  // Helpers
  helpersLoadKg: number;
  helpersPeakForceN: number;
  helpersSpeedMs: number;
  helpersTime2m: number;
  helpersPassed: boolean;
  // Elevation
  elevationAngleDeg: number;
  gravityResistN: number;
  rampAdhesionLimitN: number;
  rampTotalForceN: number;
  rampSpeedMs: number;
  rampTime2m: number;
  rampPassed: boolean;
  // Acceleration
  controlledAccMs2: number;
  topSpeedMs: number;
  totalAccTime2500Mm: number;
  // Tug of war
  rivalWeightKg: number;
  rivalTractionType: '4x2' | '4x4';
  rivalMaxAdhesionN: number;
  hitchSafetyFactor: number;
  tugOfWarWin: boolean;
}

const PROOF_TITLES: Record<CompetitionProofId, string> = {
  helpers: 'Animação Dinâmica — Prova 4.2: Tração "Helpers" (Percurso 2,0 m)',
  elevation: 'Animação Dinâmica — Prova 4.3: Subida em Rampa Inclinada (2,0 m)',
  acceleration: 'Animação Dinâmica — Prova 4.4: Arrancada & Fotocélula (2.500 mm)',
  tug_of_war: 'Animação Dinâmica — Prova 4.5: Cabo de Guerra Ferroviário (Marca 1,2 m)',
};

/**
 * Crisp 4WD Locomotive Glyph with rotating wheels + GT2 belt visual sync
 */
const AnimatedLocoGlyph: React.FC<{
  x: number;
  y: number;
  wheelAngleDeg: number;
  isSlipping: boolean;
  facing?: 'right' | 'left';
  accentColor?: string;
  label?: string;
  subLabel?: string;
  is4x4?: boolean;
}> = ({
  x,
  y,
  wheelAngleDeg,
  isSlipping,
  facing = 'right',
  accentColor = '#10b981',
  label = 'LOCO 4x4',
  subLabel = '7.65 kg',
  is4x4 = true,
}) => {
  const dir = facing === 'right' ? 1 : -1;
  const wheelOffsets = [-32, 32];

  return (
    <g transform={`translate(${x}, ${y}) scale(${dir}, 1)`}>
      {/* Chassis frame */}
      <rect x="-54" y="-32" width="108" height="18" rx="3" fill="#0f172a" stroke={accentColor} strokeWidth="1.6" />
      {/* Upper locomotive cab & hood */}
      <path
        d="M -48 -32 L -48 -60 L -8 -60 L -2 -46 L 44 -46 L 50 -32 Z"
        fill="#1e293b"
        stroke={accentColor}
        strokeWidth="1.6"
      />
      {/* Cab window */}
      <rect x="-40" y="-54" width="22" height="14" rx="2" fill="#38bdf8" opacity="0.75" />
      {/* Motor/planetary internal highlight */}
      <rect x="4" y="-42" width="26" height="9" rx="2" fill={accentColor} opacity="0.85" />
      {/* Headlight glow */}
      <circle cx="49" cy="-38" r="3" fill="#fde047" />
      <polygon points="52,-41 72,-49 72,-27 52,-35" fill="#fde047" opacity="0.16" />

      {/* GT2 Belt & Pulleys linking both axles if 4x4 */}
      {is4x4 && (
        <g>
          <rect
            x="-32"
            y="-18"
            width="64"
            height="10"
            rx="5"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeDashoffset={-((wheelAngleDeg / 360) * 28)}
          />
          <circle cx="-32" cy="-13" r="5" fill="#f59e0b" opacity="0.85" />
          <circle cx="32" cy="-13" r="5" fill="#f59e0b" opacity="0.85" />
        </g>
      )}

      {/* Drive Wheels */}
      {wheelOffsets.map((wx, idx) => (
        <g key={idx} transform={`translate(${wx}, -12)`}>
          <circle cx="0" cy="0" r="12" fill="#334155" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx="0" cy="0" r="9.5" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 2" />
          <g transform={`rotate(${wheelAngleDeg})`}>
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#cbd5e1" strokeWidth="1.8" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3" fill="#94a3b8" />
          </g>
          {/* Slip sparks if wheel adhesion limit exceeded */}
          {isSlipping && (
            <g>
              <line x1="-8" y1="11" x2="-16" y2="5" stroke="#fbbf24" strokeWidth="1.8" />
              <line x1="-3" y1="12" x2="-12" y2="10" stroke="#ef4444" strokeWidth="1.6" />
              <line x1="2" y1="11" x2="-6" y2="3" stroke="#fde047" strokeWidth="1.4" />
            </g>
          )}
        </g>
      ))}

      {/* Labels corrected for flip direction */}
      <g transform={`scale(${dir}, 1)`}>
        <text
          x="0"
          y="-68"
          textAnchor="middle"
          fill={accentColor}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {label} ({subLabel})
        </text>
      </g>
    </g>
  );
};

export const TrialAnimationStage: React.FC<Props> = ({
  activeProof,
  locoMassKg,
  maxAdhesionForceN,
  helpersLoadKg,
  helpersPeakForceN,
  helpersSpeedMs,
  helpersTime2m,
  helpersPassed,
  elevationAngleDeg,
  gravityResistN,
  rampAdhesionLimitN,
  rampTotalForceN,
  rampSpeedMs,
  rampTime2m,
  rampPassed,
  controlledAccMs2,
  topSpeedMs,
  totalAccTime2500Mm,
  rivalWeightKg,
  rivalTractionType,
  rivalMaxAdhesionN,
  hitchSafetyFactor,
  tugOfWarWin,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [elapsedS, setElapsedS] = useState<number>(0);

  const totalDurationS = useMemo(() => {
    if (activeProof === 'helpers') return Math.max(1.8, Math.min(5.0, helpersTime2m));
    if (activeProof === 'elevation') return Math.max(1.8, Math.min(5.5, rampTime2m));
    if (activeProof === 'acceleration') return Math.max(1.5, Math.min(4.5, totalAccTime2500Mm));
    return 3.0; // Tug of war duration
  }, [activeProof, helpersTime2m, rampTime2m, totalAccTime2500Mm]);

  // Reset and auto-play whenever proof or key parameters change
  useEffect(() => {
    setElapsedS(0);
    setIsPlaying(true);
  }, [
    activeProof,
    helpersLoadKg,
    elevationAngleDeg,
    rivalWeightKg,
    rivalTractionType,
    locoMassKg,
  ]);

  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = now;
      }
      const deltaS = Math.min(0.05, (now - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = now;

      setElapsedS((prev) => {
        const next = prev + deltaS * playbackSpeed;
        if (next >= totalDurationS + 1.1) {
          // Loop cleanly after 1.1s pause on the finish banner
          return 0;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackSpeed, totalDurationS]);

  const frame: TrialFrameState = useMemo(() => {
    if (activeProof === 'helpers') {
      return evaluateHelpersFrame({
        elapsedS,
        targetSpeedMs: helpersSpeedMs,
        totalDurationS,
        passed: helpersPassed,
      });
    }
    if (activeProof === 'elevation') {
      return evaluateElevationFrame({
        elapsedS,
        targetSpeedMs: rampSpeedMs,
        totalDurationS,
        passed: rampPassed,
      });
    }
    if (activeProof === 'acceleration') {
      return evaluateAccelerationFrame({
        elapsedS,
        accMs2: controlledAccMs2,
        topSpeedMs,
        totalDurationS,
      });
    }
    return evaluateTugOfWarFrame({
      elapsedS,
      ourForceN: maxAdhesionForceN,
      rivalForceN: rivalMaxAdhesionN,
      totalMassKg: locoMassKg + rivalWeightKg,
      totalDurationS,
    });
  }, [
    activeProof,
    elapsedS,
    helpersSpeedMs,
    helpersPassed,
    rampSpeedMs,
    rampPassed,
    controlledAccMs2,
    topSpeedMs,
    maxAdhesionForceN,
    rivalMaxAdhesionN,
    locoMassKg,
    rivalWeightKg,
    totalDurationS,
  ]);

  const handleRestart = () => {
    setElapsedS(0);
    setIsPlaying(true);
  };

  const displayTimeS = Math.min(elapsedS, totalDurationS);

  // Ramp geometry for Prova 4.3 (clamped vertical rise so 25 deg never clips top of SVG)
  const rampRad = (elevationAngleDeg * Math.PI) / 180;
  const rampStartX = 110;
  const rampStartY = 222;
  const rampLengthPx = Math.min(540, 148 / Math.max(0.25, Math.sin(rampRad)));
  const rampEndX = rampStartX + rampLengthPx * Math.cos(rampRad);
  const rampEndY = rampStartY - rampLengthPx * Math.sin(rampRad);
  const rampLocoDistPx = 58 + frame.progress * Math.max(180, rampLengthPx - 102);
  const rampLocoX = rampStartX + rampLocoDistPx * Math.cos(rampRad);
  const rampLocoY = rampStartY - rampLocoDistPx * Math.sin(rampRad);

  // Helpers coordinates (0..2.0 m): Locomotive leads in front (right), Cargo Wagon pulled behind (left)
  const helpersLocoX = 245 + frame.progress * 395;
  const helpersWagonX = helpersLocoX - 134;
  const ballastBlocksCount = Math.max(0, Math.min(8, Math.round((helpersLoadKg / 25) * 8)));

  // Acceleration coordinates (0..2500 mm)
  const accLocoX = 105 + frame.progress * 545;
  const accCrossedFinish = frame.progress >= 0.99;

  // Tug-of-war coordinates (-1.2m .. +1.2m)
  const tugShiftPx = (frame.distanceM / 1.2) * 168; // -168 left victory, +168 right defeat
  const ourTugX = 275 + tugShiftPx;
  const rivalTugX = 505 + tugShiftPx;
  const isTensionWarmup = !frame.isFinished && elapsedS < 0.45;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
      {/* Stage Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            {PROOF_TITLES[activeProof]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live SVG Simulation Canvas */}
      <div className="rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden">
        <svg
          viewBox="0 0 780 245"
          className="w-full h-auto block"
          role="img"
          aria-label={PROOF_TITLES[activeProof]}
        >
          <defs>
            <pattern id="trialGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.6" />
            </pattern>
            <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
            </marker>
            <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
            </marker>
            <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
            </marker>
          </defs>

          <rect width="780" height="245" fill="#020617" />
          <rect width="780" height="245" fill="url(#trialGrid)" />

          {/* ======================= PROVA 4.2: HELPERS ======================= */}
          {activeProof === 'helpers' && (
            <g>
              {/* Rail bed & sleepers */}
              <rect x="40" y="196" width="700" height="6" rx="2" fill="#475569" />
              {[0, 0.5, 1.0, 1.5, 2.0].map((mark) => {
                const xPos = Math.round(295 + (mark / 2.0) * 400);
                return (
                  <g key={mark}>
                    <line x1={xPos} y1="186" x2={xPos} y2="210" stroke="#334155" strokeWidth="1.5" />
                    <text x={xPos} y="226" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      {mark.toFixed(1)} m
                    </text>
                  </g>
                );
              })}

              {/* Finish Line Gate at 2.0m mark for Leading Locomotive Nose */}
              <line x1="695" y1="68" x2="695" y2="196" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
              <rect x="642" y="48" width="106" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x="695" y="60" textAnchor="middle" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                META 2,0 m
              </text>

              {/* Rigid Rear Coupler Bar (Wagon behind -> Locomotive rear 107.5mm hitch) */}
              <line
                x1={helpersWagonX + 58}
                y1="168"
                x2={helpersLocoX - 52}
                y2="168"
                stroke="#f59e0b"
                strokeWidth="4"
              />
              <circle cx={helpersLocoX - 54} cy="168" r="3.5" fill="#fde047" />

              {/* Heavy Ballast Freight Wagon (Trailing Behind Locomotive) */}
              <g transform={`translate(${helpersWagonX}, 196)`}>
                <rect x="-58" y="-36" width="116" height="22" rx="3" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.5" />
                {/* Steel ballast ingots */}
                {Array.from({ length: ballastBlocksCount }).map((_, idx) => (
                  <rect
                    key={idx}
                    x={-48 + idx * 12}
                    y="-52"
                    width="10"
                    height="16"
                    rx="1.5"
                    fill="#f59e0b"
                    stroke="#fef3c7"
                    strokeWidth="0.8"
                  />
                ))}
                {/* Wagon wheels */}
                {[-36, 36].map((wx, idx) => (
                  <g key={idx} transform={`translate(${wx}, -11)`}>
                    <circle cx="0" cy="0" r="11" fill="#334155" stroke="#cbd5e1" strokeWidth="1.8" />
                    <g transform={`rotate(${frame.isSlipping ? frame.wheelAngleDeg * 0.2 : frame.wheelAngleDeg})`}>
                      <line x1="-7" y1="0" x2="7" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1="0" y1="-7" x2="0" y2="7" stroke="#94a3b8" strokeWidth="1.5" />
                    </g>
                  </g>
                ))}
                <text x="0" y="-64" textAnchor="middle" fill="#22d3ee" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  VAGÃO ({(2.5 + helpersLoadKg).toFixed(1)} kg)
                </text>
              </g>

              {/* Leading Locomotive (Pulling Front) */}
              <AnimatedLocoGlyph
                x={helpersLocoX}
                y={196}
                wheelAngleDeg={frame.wheelAngleDeg}
                isSlipping={frame.isSlipping}
                accentColor={helpersPassed ? '#10b981' : '#ef4444'}
                label="LOCO 4x4"
                subLabel={`${locoMassKg.toFixed(2)} kg`}
              />

              {/* Force Vectors: Green Pull over Leading Locomotive, Red Drag over Trailing Wagon */}
              <line
                x1={helpersLocoX - 24}
                y1="108"
                x2={helpersLocoX + 38}
                y2="108"
                stroke="#10b981"
                strokeWidth="2.5"
                markerEnd="url(#arrowGreen)"
              />
              <text x={helpersLocoX + 8} y="101" textAnchor="middle" fill="#34d399" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                F_atrito: {maxAdhesionForceN.toFixed(1)} N
              </text>

              <line
                x1={helpersWagonX + 24}
                y1="108"
                x2={helpersWagonX - 38}
                y2="108"
                stroke="#ef4444"
                strokeWidth="2.2"
                markerEnd="url(#arrowRed)"
              />
              <text x={helpersWagonX - 8} y="101" textAnchor="middle" fill="#fca5a5" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                Arraste: {helpersPeakForceN.toFixed(1)} N
              </text>
            </g>
          )}

          {/* ======================= PROVA 4.3: ELEVAÇÃO ======================= */}
          {activeProof === 'elevation' && (
            <g>
              {/* Base horizontal ground */}
              <line x1="60" y1={rampStartY} x2="720" y2={rampStartY} stroke="#334155" strokeWidth="2" />

              {/* Protractor angle arc */}
              <path
                d={`M ${rampStartX + 75} ${rampStartY} A 75 75 0 0 0 ${rampStartX + 75 * Math.cos(rampRad)} ${rampStartY - 75 * Math.sin(rampRad)}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <text
                x={rampStartX + 92}
                y={rampStartY - 12}
                fill="#fbbf24"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                θ = {elevationAngleDeg}°
              </text>

              {/* Inclined steel rail structure */}
              <polygon
                points={`${rampStartX},${rampStartY} ${rampEndX},${rampEndY} ${rampEndX},${rampStartY}`}
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.2"
                opacity="0.85"
              />
              <line
                x1={rampStartX}
                y1={rampStartY}
                x2={rampEndX}
                y2={rampEndY}
                stroke="#22d3ee"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Ramp summit flag (2.0 m) */}
              <line x1={rampEndX} y1={rampEndY - 56} x2={rampEndX} y2={rampEndY} stroke="#10b981" strokeWidth="2" />
              <rect x={rampEndX - 64} y={rampEndY - 62} width="64" height="17" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x={rampEndX - 32} y={rampEndY - 50} textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">
                TOPO 2,0m
              </text>

              {/* Rotated Climbing Locomotive */}
              <g transform={`translate(${rampLocoX}, ${rampLocoY}) rotate(${-elevationAngleDeg})`}>
                <AnimatedLocoGlyph
                  x={0}
                  y={-2}
                  wheelAngleDeg={frame.wheelAngleDeg}
                  isSlipping={frame.isSlipping}
                  accentColor={rampPassed ? '#10b981' : '#ef4444'}
                  label="LOCO 4x4"
                  subLabel={`${locoMassKg.toFixed(2)} kg`}
                />

                {/* Force vectors along ramp frame */}
                <line x1="15" y1="-82" x2="72" y2="-82" stroke="#10b981" strokeWidth="2.4" markerEnd="url(#arrowGreen)" />
                <text x="45" y="-89" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  Aderência {rampAdhesionLimitN.toFixed(1)}N
                </text>

                <line x1="-15" y1="-82" x2="-68" y2="-82" stroke="#ef4444" strokeWidth="2.2" markerEnd="url(#arrowRed)" />
                <text x="-44" y="-89" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  mg·sinθ {gravityResistN.toFixed(1)}N
                </text>
              </g>

              {/* Info readout */}
              <text x="64" y="34" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                Força exigida na rampa: {rampTotalForceN.toFixed(1)} N · Limite 4WD: {rampAdhesionLimitN.toFixed(1)} N
              </text>
            </g>
          )}

          {/* ======================= PROVA 4.4: ACELERAÇÃO ======================= */}
          {activeProof === 'acceleration' && (
            <g>
              {/* Track bed */}
              <rect x="45" y="192" width="690" height="6" rx="2" fill="#475569" />

              {/* Distance ticks: 0, 500, 1000, 1500, 2000, 2500 mm */}
              {[0, 500, 1000, 1500, 2000, 2500].map((mm) => {
                const tx = 105 + (mm / 2500) * 545;
                return (
                  <g key={mm}>
                    <line x1={tx} y1="184" x2={tx} y2="206" stroke="#334155" strokeWidth="1.5" />
                    <text x={tx} y="224" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                      {mm}mm
                    </text>
                  </g>
                );
              })}

              {/* Start Christmas Tree Lights */}
              <rect x="52" y="76" width="22" height="58" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
              <circle cx="63" cy="90" r="5" fill={elapsedS < 0.15 ? '#ef4444' : '#450a0a'} />
              <circle cx="63" cy="105" r="5" fill={elapsedS >= 0.15 && elapsedS < 0.3 ? '#f59e0b' : '#451a03'} />
              <circle cx="63" cy="120" r="5" fill={elapsedS >= 0.3 ? '#10b981' : '#052e16'} />

              {/* Finish Photocell Laser Gate at 2500mm (x=650) */}
              <line
                x1="650"
                y1="56"
                x2="650"
                y2="192"
                stroke={accCrossedFinish ? '#10b981' : '#ef4444'}
                strokeWidth="2.4"
                strokeDasharray={accCrossedFinish ? 'none' : '4 3'}
              />
              <rect
                x="592"
                y="34"
                width="118"
                height="20"
                rx="4"
                fill={accCrossedFinish ? '#064e3b' : '#450a0a'}
                stroke={accCrossedFinish ? '#10b981' : '#ef4444'}
                strokeWidth="1.2"
              />
              <text
                x="651"
                y="47"
                textAnchor="middle"
                fill={accCrossedFinish ? '#6ee7b7' : '#fca5a5'}
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {accCrossedFinish ? 'FOTOCÉLULA: OK!' : 'FOTOCÉLULA 2500mm'}
              </text>

              {/* Speed wake trail behind locomotive */}
              {frame.instantSpeedMs > 0.1 && (
                <g opacity={Math.min(0.85, frame.instantSpeedMs / topSpeedMs)}>
                  <line x1={accLocoX - 58} y1="152" x2={accLocoX - 115} y2="152" stroke="#22d3ee" strokeWidth="2" />
                  <line x1={accLocoX - 58} y1="164" x2={accLocoX - 96} y2="164" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={accLocoX - 58} y1="176" x2={accLocoX - 132} y2="176" stroke="#10b981" strokeWidth="1.5" />
                </g>
              )}

              <AnimatedLocoGlyph
                x={accLocoX}
                y={192}
                wheelAngleDeg={frame.wheelAngleDeg}
                isSlipping={false}
                accentColor="#22d3ee"
                label="SPRINT 4x4"
                subLabel={`${frame.instantSpeedMs.toFixed(2)} m/s`}
              />

              {/* Anti-slip PWM HUD bar */}
              <g transform="translate(105, 32)">
                <rect x="0" y="0" width="220" height="24" rx="5" fill="#0f172a" stroke="#1e293b" />
                <text x="10" y="15" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                  PWM Anti-Patinagem:
                </text>
                <rect x="135" y="6" width="74" height="11" rx="2" fill="#1e293b" />
                <rect x="135" y="6" width={(frame.pwmPercent / 100) * 74} height="11" rx="2" fill="#10b981" />
              </g>
            </g>
          )}

          {/* ======================= PROVA 4.5: CABO DE GUERRA ======================= */}
          {activeProof === 'tug_of_war' && (
            <g>
              {/* Rail bed */}
              <rect x="40" y="194" width="700" height="6" rx="2" fill="#475569" />

              {/* Center zero line & 1.2m win thresholds */}
              <line x1="390" y1="74" x2="390" y2="206" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="390" y="224" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
                CENTRO (0,0 m)
              </text>

              {/* Left Team Victory Marker (-1.2m -> rival dragged left or our rear crosses 1.2m) */}
              <line x1="165" y1="68" x2="165" y2="202" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
              <rect x="98" y="46" width="134" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x="165" y="58" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">
                VITÓRIA EQUIPE (1,2 m)
              </text>

              {/* Right Rival Victory Marker */}
              <line x1="615" y1="68" x2="615" y2="202" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
              <rect x="548" y="46" width="134" height="18" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
              <text x="615" y="58" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">
                META ADVERSÁRIO (1,2 m)
              </text>

              {/* Tension Drawbar & Hitch Pin (107.5mm) */}
              <line
                x1={ourTugX + 52}
                y1="168"
                x2={rivalTugX - 52}
                y2="168"
                stroke={isTensionWarmup ? '#fde047' : '#f59e0b'}
                strokeWidth={isTensionWarmup ? 5 : 4}
              />
              <circle cx={(ourTugX + rivalTugX) / 2} cy="168" r="5" fill="#fde047" stroke="#0f172a" strokeWidth="1.2" />
              <text
                x={(ourTugX + rivalTugX) / 2}
                y="153"
                textAnchor="middle"
                fill="#fde047"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                FS={hitchSafetyFactor.toFixed(0)}x
              </text>

              {/* Left Locomotive: LOCO 4x4 */}
              <AnimatedLocoGlyph
                x={ourTugX}
                y={194}
                facing="left"
                wheelAngleDeg={tugOfWarWin ? -frame.wheelAngleDeg : frame.wheelAngleDeg}
                isSlipping={!tugOfWarWin && !isTensionWarmup}
                accentColor="#10b981"
                label="LOCO 4x4"
                subLabel={`${maxAdhesionForceN.toFixed(1)}N`}
              />

              {/* Right Locomotive: Rival */}
              <AnimatedLocoGlyph
                x={rivalTugX}
                y={194}
                facing="right"
                wheelAngleDeg={tugOfWarWin ? -frame.wheelAngleDeg : frame.wheelAngleDeg}
                isSlipping={tugOfWarWin && !isTensionWarmup}
                accentColor="#ef4444"
                label={`RIVAL ${rivalTractionType}`}
                subLabel={`${rivalMaxAdhesionN.toFixed(1)}N`}
                is4x4={rivalTractionType === '4x4'}
              />

              {/* Top Force Comparison Arrows */}
              <line
                x1={ourTugX}
                y1="100"
                x2={ourTugX - 64}
                y2="100"
                stroke="#10b981"
                strokeWidth="2.6"
                markerEnd="url(#arrowGreen)"
              />
              <line
                x1={rivalTugX}
                y1="100"
                x2={rivalTugX + 52}
                y2="100"
                stroke="#ef4444"
                strokeWidth="2.4"
                markerEnd="url(#arrowRed)"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Live Telemetry Footer Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Cronômetro:</span>
          <span className="text-white font-bold">{displayTimeS.toFixed(2)} s</span>
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">
            {activeProof === 'tug_of_war' ? 'Deslocamento:' : 'Distância:'}
          </span>
          <span className="text-cyan-400 font-bold">
            {activeProof === 'acceleration'
              ? `${Math.round(frame.distanceM * 1000)} mm`
              : `${Math.abs(frame.distanceM).toFixed(2)} m`}
          </span>
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-emerald-400" /> Vel.:
          </span>
          <span className="text-emerald-400 font-bold">{frame.instantSpeedMs.toFixed(2)} m/s</span>
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Status:</span>
          <span
            className={`font-bold ${
              frame.isSlipping
                ? 'text-red-400'
                : frame.isFinished
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {frame.isSlipping
              ? 'PATINAGEM'
              : frame.isFinished
              ? 'CONCLUÍDA'
              : 'EM PROVA'}
          </span>
        </div>
      </div>
    </div>
  );
};
