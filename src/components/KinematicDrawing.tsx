import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Play, 
  Pause, 
  RotateCw, 
  Download, 
  Layers, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2,
  FileCode,
  ZoomIn,
  Sparkles
} from 'lucide-react';
import { TransmissionConfig, LocomotiveSpecs } from '../types/locomotive';

interface Props {
  transmission: TransmissionConfig;
  specs: LocomotiveSpecs;
}

export const KinematicDrawing: React.FC<Props> = ({ transmission, specs }) => {
  const [view, setView] = useState<'top' | 'side' | 'isometric'>('top');
  const [styleMode, setStyleMode] = useState<'blueprint' | 'engineering'>('blueprint');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [selectedPart, setSelectedPart] = useState<string | null>('motor_775');

  // Animation angle
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const updateAnim = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isRunning) {
        // Spin speed based on RPM
        const degPerSec = (transmission.motorRpm / 60) * 360 * speedMultiplier * 0.4;
        setRotationAngle((prev) => (prev + degPerSec * delta) % 360);
      }
      animFrameRef.current = requestAnimationFrame(updateAnim);
    };

    animFrameRef.current = requestAnimationFrame(updateAnim);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, speedMultiplier, transmission.motorRpm]);

  // Kinematic calculations
  const gearRatio = transmission.drivenGearTeeth / transmission.motorPinionTeeth; // 45 / 15 = 3.0
  const wheelAngle = rotationAngle / gearRatio; // Speed of axle 1 and axle 2
  const beltOffset = (wheelAngle * 1.5) % 30; // GT2 tooth translation offset

  // Download SVG Blueprint
  const downloadSvg = () => {
    const svgElem = document.getElementById('loco-drawing-svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Desenho-Tecnico-Transmissao-4WD-CavalosDeFerro-${view}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const partInfoMap: Record<string, { title: string; desc: string; specs: string[]; tag: string }> = {
    motor_775: {
      title: 'Motor DC RS-775 + Redutor Planetário Metálico',
      tag: 'Fonte Primária de Potência',
      desc: 'Motor DC de 12V-24V montado transversalmente no chassi. O redutor planetário interno em aço sinterizado (1:19.2) transforma 6500 RPM em ~340 RPM com torque contínuo elevado (4.8 N.m) e pico de stall de 18.5 N.m.',
      specs: [
        'Tensão de alimentação: 14.8V (LiPo 4S 5200mAh)',
        'Diâmetro externo da carcaça: 44.0 mm',
        'Comprimento do conjunto: 105.0 mm',
        'Eixo de saída: Aço temperado 8.0 mm com chanfro D-cut'
      ]
    },
    pinion_gear: {
      title: 'Pinhão do Motor M1.0 (15 Dentes)',
      tag: '1º Estágio de Redução',
      desc: 'Pinhão cilíndrico de dentes retos em latão usinado ou aço fixado ao eixo do motor por parafuso de pressão sextavado.',
      specs: [
        'Módulo: M1.0',
        'Número de dentes (Z1): 15',
        'Diâmetro primitivo (Dp): 15.0 mm',
        'Diâmetro externo (De): 17.0 mm',
        'Largura da face do dente: 10.0 mm'
      ]
    },
    driven_gear: {
      title: 'Coroa Cilíndrica Reta M1.0 (45 Dentes)',
      tag: 'Redução Secundária 3:1 no Eixo 1',
      desc: 'Engrenagem conduzida montada rigidamente no Eixo Traseiro (Eixo 1). Fabricada em Nylon PA12 com 100% de preenchimento para máxima absorção de impacto e baixo ruído.',
      specs: [
        'Módulo: M1.0',
        'Número de dentes (Z2): 45',
        'Diâmetro primitivo (Dp): 45.0 mm',
        'Diâmetro externo (De): 47.0 mm',
        'Redução do par: i = 45 / 15 = 3.0:1',
        'Torque resultante no eixo: ~13.0 N.m'
      ]
    },
    pulley_1: {
      title: 'Polia Sincronizadora GT2 Traseira (30 Dentes)',
      tag: 'Transmissão Positiva Eixo 1',
      desc: 'Polia de alumínio/PETG fixada no centro do Eixo 1 com flanges laterais de retenção. Gira na mesma velocidade do Eixo 1 (~113 RPM).',
      specs: [
        'Passo da correia (p): 2.0 mm',
        'Número de dentes: 30T',
        'Diâmetro primitivo: 19.10 mm',
        'Furo central: 8.0 mm H7'
      ]
    },
    gt2_belt: {
      title: 'Correia Sincronizadora Fechada GT2-380',
      tag: 'Acoplamento Síncrono 4x4 (AWD)',
      desc: 'Correia dentada de neoprene com alma de tração em fibra de vidro/aramida. Conecta o Eixo 1 ao Eixo 2 com relação exata de 1:1, garantindo tração integral positiva nas 4 rodas sem deslizamento.',
      specs: [
        'Perfil do dente: GT2 curvilíneo (zero folga reversa)',
        'Passo: 2.0 mm | Largura: 9.0 mm',
        'Comprimento de passo: 380.0 mm (190 dentes)',
        'Distância entre centros de polias: 160.0 mm'
      ]
    },
    pulley_2: {
      title: 'Polia Sincronizadora GT2 Dianteira (30 Dentes)',
      tag: 'Transmissão Positiva Eixo 2',
      desc: 'Polia idêntica à traseira, montada no Eixo Dianteiro (Eixo 2). Recebe 50% da potência motriz via correia GT2.',
      specs: [
        'Número de dentes: 30T',
        'Diâmetro primitivo: 19.10 mm',
        'Relação de velocidade entre eixos: 1.000:1 (Sincronismo puro)'
      ]
    },
    wheel_gauge: {
      title: 'Rodeiros Ferroviários & Bitola de 150 mm',
      tag: 'Regra 3.a do Regulamento Oficial',
      desc: 'Quatro rodas com perfil cônico e friso interno (flange) usinado/impresso 3D para manter a locomotiva perfeitamente guiada nos trilhos sem descarrilar. Cada roda possui canal rebaixado com anel de poliuretano (O-ring) para aderência máxima.',
      specs: [
        'Bitola centro-a-centro das rodas: Exatamente 150.0 mm',
        'Diâmetro de rolamento: 65.0 mm',
        'Altura do friso (flange): 4.0 mm',
        'Coeficiente de atrito com anel PU: μ = 0.65 (vs 0.15 do metal liso)'
      ]
    },
    hitch_pin: {
      title: 'Pino & Barra de Engate Regulamentar',
      tag: 'Regra 3.b do Regulamento Oficial',
      desc: 'Engates dianteiro e traseiro posicionados a exatamente 107.5 mm acima da face superior do boleto do trilho (dentro da janela de 105 a 110 mm). Projetados para suportar tração extrema no Cabo de Guerra e empurrar 20kg no Helpers.',
      specs: [
        'Altura do centro do engate: 107.5 mm',
        'Diâmetro do pino de aço: 6.0 mm SAE 1045',
        'Fator de segurança ao cisalhamento: FS > 100'
      ]
    }
  };

  const activePart = selectedPart ? partInfoMap[selectedPart] : partInfoMap['motor_775'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Desenho Técnico do Funcionamento: Motor, Transmissão e 4 Rodas
              <span className="text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Cinemática 2D Interativa
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Esquema mecânico detalhado mostrando o fluxo de potência do Motor 775, pinhão 15T, coroa 45T, correia GT2 e os 4 rodeiros na bitola de 150 mm
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setView('top')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === 'top' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Superior (Planta)
            </button>
            <button
              onClick={() => setView('side')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === 'side' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vista Lateral (Elevação)
            </button>
            <button
              onClick={() => setView('isometric')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                view === 'isometric' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ilustração Isométrica (3D)
            </button>
          </div>

          {/* Theme Style Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStyleMode('blueprint')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                styleMode === 'blueprint' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blueprint Azul
            </button>
            <button
              onClick={() => setStyleMode('engineering')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                styleMode === 'engineering' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Engenharia Escura
            </button>
          </div>

          {/* Export SVG */}
          <button
            onClick={downloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow"
            title="Baixar desenho vetorial SVG para o Memorial Descritivo"
          >
            <Download className="w-3.5 h-3.5" /> Baixar SVG
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="p-6 space-y-6">
        <div 
          className={`relative w-full rounded-2xl border overflow-hidden transition-all shadow-inner ${
            styleMode === 'blueprint'
              ? 'bg-[#0f2444] border-blue-500/40 text-blue-100'
              : 'bg-slate-950 border-slate-800 text-slate-200'
          }`}
        >
          {/* Blueprint Grid Pattern Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: styleMode === 'blueprint'
                ? 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)'
                : 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Blueprint Header Stamp */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800/80 text-[11px] font-mono shadow-lg">
            <span className="font-bold text-cyan-400">CAVALOS DE FERRO 2026 • REF. REGULAMENTO 2026</span>
            <span className="text-slate-300">DESENHO CINEMÁTICO: SISTEMA 4WD (150 mm GAUGE)</span>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
              <span>ESCALA: 1:2.5</span>
              <span>•</span>
              <span>UNIDADE: mm</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">100% REGULAMENTAR</span>
            </div>
          </div>

          {/* Playback HUD floating on right */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80 shadow-lg text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isRunning ? 'Pausar' : 'Animar'}
              </button>

              <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Cotas (mm)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Velocidade:</span>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 font-bold">{speedMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          {/* Main Visual Display (SVG Canvas or Isometric Illustration) */}
          {view === 'isometric' ? (
            <div className="relative w-full h-[580px] flex items-center justify-center p-4 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/assets/locomotive_technical_illustration.jpg"
                alt="Ilustração Isométrica de Precisão do Mecanismo 4WD"
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />

              {/* Interactive Hotspot Badges on the Illustration */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-full max-w-[850px] aspect-[16/9] pointer-events-auto">
                  {/* Motor Hotspot */}
                  <button
                    onClick={() => setSelectedPart('motor_775')}
                    className="absolute top-[28%] left-[62%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    title="Inspecionar Motor DC 775"
                  >
                    <span className="flex h-6 w-6 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 border-2 border-white items-center justify-center text-[10px] font-bold text-slate-950">
                        1
                      </span>
                    </span>
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      Motor RS-775 + Planetária
                    </span>
                  </button>

                  {/* Gear Hotspot */}
                  <button
                    onClick={() => setSelectedPart('driven_gear')}
                    className="absolute top-[52%] left-[55%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    title="Inspecionar Par de Engrenagens M1.0"
                  >
                    <span className="flex h-6 w-6 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-cyan-500 border-2 border-white items-center justify-center text-[10px] font-bold text-slate-950">
                        2
                      </span>
                    </span>
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      Coroa 45T / Pinhão 15T (3:1)
                    </span>
                  </button>

                  {/* Belt Hotspot */}
                  <button
                    onClick={() => setSelectedPart('gt2_belt')}
                    className="absolute top-[68%] left-[48%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    title="Inspecionar Correia GT2"
                  >
                    <span className="flex h-6 w-6 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-white items-center justify-center text-[10px] font-bold text-slate-950">
                        3
                      </span>
                    </span>
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      Correia GT2-380 (160mm)
                    </span>
                  </button>

                  {/* Wheels & Gauge Hotspot */}
                  <button
                    onClick={() => setSelectedPart('wheel_gauge')}
                    className="absolute top-[75%] left-[70%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    title="Inspecionar Bitola de 150 mm"
                  >
                    <span className="flex h-6 w-6 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-500 border-2 border-white items-center justify-center text-[10px] font-bold text-slate-950">
                        4
                      </span>
                    </span>
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      Bitola: 150 mm Oficial
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[580px] flex items-center justify-center p-4 select-none">
              <svg
                id="loco-drawing-svg"
                viewBox="0 0 900 540"
                className="w-full h-full max-h-[560px]"
                xmlns="http://www.w3.org/2000/svg"
              >
              <defs>
                {/* Patterns and Gradients */}
                <pattern id="hatch-rail" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#64748b" strokeWidth="1.5" />
                </pattern>

                <linearGradient id="grad-motor" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <linearGradient id="grad-brass" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>

                <linearGradient id="grad-nylon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ===============================================================
                  VISTA SUPERIOR (PLANTA 2D)
                 =============================================================== */}
              {view === 'top' && (
                <g transform="translate(450, 270)">
                  {/* --- 1. RAILROAD TRACKS (Trilhos e Dormentes) --- */}
                  {/* Gauge = 150 mm -> In drawing scale: 1mm = 1.8px -> 150mm = 270px (Y = -135 and +135) */}
                  <g opacity="0.6">
                    {/* Wooden sleepers (Dormentes) */}
                    {[-260, -195, -130, -65, 0, 65, 130, 195, 260].map((xPos, idx) => (
                      <rect
                        key={idx}
                        x={xPos - 18}
                        y="-175"
                        width="36"
                        height="350"
                        rx="3"
                        fill="#1e293b"
                        stroke="#334155"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Steel Rails Left & Right (Trilho Superior e Inferior espaçados a 150 mm) */}
                    {/* Rail 1 (Top / Roda Esquerda) */}
                    <rect x="-310" y="-144" width="620" height="18" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-310" y1="-135" x2="310" y2="-135" stroke="#f8fafc" strokeWidth="2" strokeDasharray="6 4" />

                    {/* Rail 2 (Bottom / Roda Direita) */}
                    <rect x="-310" y="126" width="620" height="18" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-310" y1="135" x2="310" y2="135" stroke="#f8fafc" strokeWidth="2" strokeDasharray="6 4" />
                  </g>

                  {/* --- 2. CHASSIS OUTLINE (Projeção do Chassi 3D) --- */}
                  <rect
                    x="-240"
                    y="-110"
                    width="480"
                    height="220"
                    rx="14"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="8 4"
                    opacity="0.4"
                  />
                  <text x="-230" y="-95" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">
                    CONTORNO DO CHASSI IMPRESSO EM 3D (PETG / PA-CF)
                  </text>

                  {/* --- 3. EIXOS DE AÇO (Eixo 1 Traseiro e Eixo 2 Dianteiro) --- */}
                  {/* Wheelbase = 160 mm -> In drawing scale: 160 mm = 240px -> X = -120 (Traseiro) e +120 (Dianteiro) */}
                  
                  {/* EIXO 1 (Traseiro em X = -120) */}
                  <g 
                    onClick={() => setSelectedPart('wheel_gauge')}
                    className="cursor-pointer hover:opacity-90"
                  >
                    {/* Steel shaft 8mm */}
                    <rect x="-125" y="-140" width="10" height="280" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                    {/* 4 Bearings 608ZZ */}
                    <rect x="-128" y="-105" width="16" height="14" rx="2" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="-128" y="91" width="16" height="14" rx="2" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                    
                    {/* Roda Esquerda (Top) */}
                    <rect x="-142" y="-148" width="44" height="26" rx="3" fill="#64748b" stroke="#f8fafc" strokeWidth="1.5" />
                    {/* Flange (Friso interno) */}
                    <rect x="-142" y="-123" width="44" height="5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    {/* PU O-Ring tread band */}
                    <rect x="-138" y="-146" width="36" height="6" fill="#f59e0b" />

                    {/* Roda Direita (Bottom) */}
                    <rect x="-142" y="122" width="44" height="26" rx="3" fill="#64748b" stroke="#f8fafc" strokeWidth="1.5" />
                    <rect x="-142" y="118" width="44" height="5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <rect x="-138" y="140" width="36" height="6" fill="#f59e0b" />
                  </g>

                  {/* EIXO 2 (Dianteiro em X = +120) */}
                  <g 
                    onClick={() => setSelectedPart('wheel_gauge')}
                    className="cursor-pointer hover:opacity-90"
                  >
                    <rect x="115" y="-140" width="10" height="280" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                    {/* Bearings */}
                    <rect x="112" y="-105" width="16" height="14" rx="2" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="112" y="91" width="16" height="14" rx="2" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Roda Esquerda (Top) */}
                    <rect x="98" y="-148" width="44" height="26" rx="3" fill="#64748b" stroke="#f8fafc" strokeWidth="1.5" />
                    <rect x="98" y="-123" width="44" height="5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <rect x="102" y="-146" width="36" height="6" fill="#f59e0b" />

                    {/* Roda Direita (Bottom) */}
                    <rect x="98" y="122" width="44" height="26" rx="3" fill="#64748b" stroke="#f8fafc" strokeWidth="1.5" />
                    <rect x="98" y="118" width="44" height="5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <rect x="102" y="140" width="36" height="6" fill="#f59e0b" />
                  </g>

                  {/* --- 4. TRANSMISSÃO POR CORREIA SÍNCRONA GT2 (ENTRE X=-120 E X=+120) --- */}
                  <g 
                    onClick={() => setSelectedPart('gt2_belt')}
                    className="cursor-pointer"
                  >
                    {/* Top span of GT2 Belt */}
                    <rect x="-120" y="-14" width="240" height="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Bottom span of GT2 Belt */}
                    <rect x="-120" y="8" width="240" height="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

                    {/* Moving teeth pattern representation */}
                    <g transform={`translate(${beltOffset}, 0)`}>
                      {[-100, -75, -50, -25, 0, 25, 50, 75, 100].map((dx, i) => (
                        <g key={i}>
                          <line x1={dx} y1="-14" x2={dx + 5} y2="-8" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1={dx} y1="8" x2={dx + 5} y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                        </g>
                      ))}
                    </g>

                    {/* Direction Flow Arrows on Belt */}
                    <polygon points="10,-11 2,-7 2,-15" fill="#22c55e" />
                    <polygon points="-10,11 -2,7 -2,15" fill="#22c55e" />

                    {/* Tensioner Idler Bearing */}
                    <circle cx="15" cy="-22" r="10" fill="#475569" stroke="#e2e8f0" strokeWidth="1.5" />
                    <circle cx="15" cy="-22" r="4" fill="#0f172a" />
                    <text x="30" y="-22" fill="#22c55e" fontSize="9" fontFamily="monospace">Tensor Excêntrico GT2</text>
                  </g>

                  {/* --- 5. POLIAS SINCRONIZADORAS GT2 30T NOS EIXOS --- */}
                  {/* Polia 1 (Traseira no Eixo 1: X = -120, Y = 0) */}
                  <g 
                    onClick={() => setSelectedPart('pulley_1')}
                    className="cursor-pointer"
                    transform={`translate(-120, 0) rotate(${wheelAngle})`}
                  >
                    <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
                    {/* 6 Pulley spoke markers */}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={15 * Math.cos((deg * Math.PI) / 180)}
                        y2={15 * Math.sin((deg * Math.PI) / 180)}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>

                  {/* Polia 2 (Dianteira no Eixo 2: X = +120, Y = 0) */}
                  <g 
                    onClick={() => setSelectedPart('pulley_2')}
                    className="cursor-pointer"
                    transform={`translate(120, 0) rotate(${wheelAngle})`}
                  >
                    <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={15 * Math.cos((deg * Math.PI) / 180)}
                        y2={15 * Math.sin((deg * Math.PI) / 180)}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>

                  {/* --- 6. ENGRENAGEM CONDUZIDA 45T M1.0 (NO EIXO 1: X = -120, Y = -45) --- */}
                  <g 
                    onClick={() => setSelectedPart('driven_gear')}
                    className="cursor-pointer"
                    transform={`translate(-120, -45) rotate(${wheelAngle})`}
                  >
                    {/* Large Spur Gear 45T */}
                    <circle cx="0" cy="0" r="32" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" filter="url(#glow-cyan)" />
                    {/* Teeth representation */}
                    {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((deg, i) => (
                      <rect
                        key={i}
                        x="-2.5"
                        y="-35"
                        width="5"
                        height="6"
                        rx="1"
                        fill="#38bdf8"
                        transform={`rotate(${deg})`}
                      />
                    ))}
                    <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#bae6fd" strokeWidth="1.5" />
                    <text x="0" y="3" textAnchor="middle" fill="#bae6fd" fontSize="9" fontWeight="bold" fontFamily="monospace">45T</text>
                  </g>

                  {/* --- 7. MOTOR DC 775 + REDUTOR PLANETÁRIO + PINHÃO 15T --- */}
                  {/* Positioned so pinion meshes with the 45T spur gear at Y = -45, X = -120 + 38 = -82 */}
                  <g 
                    onClick={() => setSelectedPart('motor_775')}
                    className="cursor-pointer"
                  >
                    {/* Motor body cylinder (RS-775) */}
                    <rect x="-82" y="-95" width="85" height="42" rx="6" fill="url(#grad-motor)" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="-40" y="-71" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      MOTOR DC 775
                    </text>
                    <text x="-40" y="-60" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                      12V - 16.8V LiPo
                    </text>

                    {/* Planetary Gearbox canister (1:19.2) */}
                    <rect x="-106" y="-92" width="24" height="36" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="-94" y="-72" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      19.2:1
                    </text>
                  </g>

                  {/* Motor Pinion 15T (rotating opposite to spur gear) */}
                  <g 
                    onClick={() => setSelectedPart('pinion_gear')}
                    className="cursor-pointer"
                    transform={`translate(-82, -45) rotate(${-rotationAngle})`}
                  >
                    <circle cx="0" cy="0" r="14" fill="#d97706" stroke="#fde68a" strokeWidth="1.5" />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
                      <rect
                        key={i}
                        x="-1.5"
                        y="-16"
                        width="3"
                        height="4"
                        rx="0.5"
                        fill="#fbbf24"
                        transform={`rotate(${deg})`}
                      />
                    ))}
                    <circle cx="0" cy="0" r="4" fill="#78350f" />
                    <text x="0" y="3" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="bold" fontFamily="monospace">15T</text>
                  </g>

                  {/* Mesh contact indicator arrow */}
                  <g transform="translate(-101, -45)">
                    <circle cx="0" cy="0" r="3" fill="#ef4444" />
                    <text x="6" y="-6" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      Engrenamento M1.0 (3:1)
                    </text>
                  </g>

                  {/* --- 8. HITCHES (Engate Dianteiro e Traseiro a 107.5 mm) --- */}
                  <g 
                    onClick={() => setSelectedPart('hitch_pin')}
                    className="cursor-pointer"
                  >
                    {/* Rear Hitch (X = -250) */}
                    <rect x="-265" y="-12" width="25" height="24" rx="3" fill="#64748b" stroke="#e2e8f0" strokeWidth="1.5" />
                    <circle cx="-252" cy="0" r="4.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                    <text x="-260" y="-18" textAnchor="end" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                      Engate Traseiro
                    </text>

                    {/* Front Hitch (X = +250) */}
                    <rect x="240" y="-12" width="25" height="24" rx="3" fill="#64748b" stroke="#e2e8f0" strokeWidth="1.5" />
                    <circle cx="252" cy="0" r="4.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                    <text x="260" y="-18" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                      Engate Frontal
                    </text>
                  </g>

                  {/* --- 9. DIMENSION OVERLAYS (COTAS TÉCNICAS ABNT) --- */}
                  {showDimensions && (
                    <g>
                      {/* Cota Bitola = 150 mm (Distância entre centro das rodas: Y = -135 a +135 -> 270px) */}
                      <g stroke="#38bdf8" strokeWidth="1.5">
                        <line x1="160" y1="-135" x2="200" y2="-135" />
                        <line x1="160" y1="135" x2="200" y2="135" />
                        <line x1="190" y1="-135" x2="190" y2="135" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <polygon points="190,-135 186,-127 194,-127" fill="#38bdf8" />
                        <polygon points="190,135 186,127 194,127" fill="#38bdf8" />
                      </g>
                      <rect x="155" y="-10" width="70" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                      <text x="190" y="4" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        150,0 mm
                      </text>
                      <text x="190" y="18" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                        (BITOLA OFICIAL)
                      </text>

                      {/* Cota Entre-eixos (Wheelbase = 160 mm: X = -120 a +120 -> 240px) */}
                      <g stroke="#22c55e" strokeWidth="1.5">
                        <line x1="-120" y1="165" x2="-120" y2="200" />
                        <line x1="120" y1="165" x2="120" y2="200" />
                        <line x1="-120" y1="190" x2="120" y2="190" />
                        <polygon points="-120,190 -112,186 -112,194" fill="#22c55e" />
                        <polygon points="120,190 112,186 112,194" fill="#22c55e" />
                      </g>
                      <rect x="-35" y="180" width="70" height="20" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
                      <text x="0" y="194" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        160,0 mm
                      </text>

                      {/* Cota Comprimento Máximo (335 mm) */}
                      <g stroke="#a855f7" strokeWidth="1" opacity="0.8">
                        <line x1="-240" y1="-120" x2="-240" y2="-155" />
                        <line x1="240" y1="-120" x2="240" y2="-155" />
                        <line x1="-240" y1="-145" x2="240" y2="-145" />
                      </g>
                      <rect x="-45" y="-155" width="90" height="18" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
                      <text x="0" y="-142" textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="monospace">
                        COMPR: 335 mm (&lt;360)
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* ===============================================================
                  VISTA LATERAL (ELEVAÇÃO 2D)
                 =============================================================== */}
              {view === 'side' && (
                <g transform="translate(450, 270)">
                  {/* Steel Rail Line (Y = 80) */}
                  <rect x="-340" y="80" width="680" height="24" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="-340" y="104" width="680" height="14" fill="#475569" stroke="#334155" strokeWidth="1" />
                  <text x="-320" y="96" fill="#f8fafc" fontSize="10" fontFamily="monospace">TOPO DO TRILHO (NÍVEL ZERO REFERENCIAL)</text>

                  {/* Sleepers under rail */}
                  {[-280, -200, -120, -40, 40, 120, 200, 280].map((x, i) => (
                    <rect key={i} x={x - 25} y="118" width="50" height="24" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  ))}

                  {/* 4 Wheels (Side view: Wheel 1 at X = -120, Wheel 2 at X = +120) */}
                  {/* Wheel diameter = 65 mm (Radius = 32.5 mm -> In scale: radius = 55px) */}
                  {/* Wheel 1 (Traseira) */}
                  <g 
                    onClick={() => setSelectedPart('wheel_gauge')}
                    className="cursor-pointer"
                    transform={`translate(-120, 25) rotate(${wheelAngle})`}
                  >
                    <circle cx="0" cy="0" r="55" fill="#475569" stroke="#cbd5e1" strokeWidth="2.5" />
                    {/* Flange ring */}
                    <circle cx="0" cy="0" r="62" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="6 3" />
                    {/* PU O-ring rubber tread */}
                    <circle cx="0" cy="0" r="54" fill="none" stroke="#f59e0b" strokeWidth="4" />
                    {/* Axle hub */}
                    <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    {/* Rolling markers */}
                    {[0, 90, 180, 270].map((deg, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={48 * Math.cos((deg * Math.PI) / 180)}
                        y2={48 * Math.sin((deg * Math.PI) / 180)}
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    ))}
                  </g>

                  {/* Wheel 2 (Dianteira) */}
                  <g 
                    onClick={() => setSelectedPart('wheel_gauge')}
                    className="cursor-pointer"
                    transform={`translate(120, 25) rotate(${wheelAngle})`}
                  >
                    <circle cx="0" cy="0" r="55" fill="#475569" stroke="#cbd5e1" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="62" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="6 3" />
                    <circle cx="0" cy="0" r="54" fill="none" stroke="#f59e0b" strokeWidth="4" />
                    <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    {[0, 90, 180, 270].map((deg, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={48 * Math.cos((deg * Math.PI) / 180)}
                        y2={48 * Math.sin((deg * Math.PI) / 180)}
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    ))}
                  </g>

                  {/* Timing Belt GT2 connecting the two wheel hubs horizontally */}
                  <g 
                    onClick={() => setSelectedPart('gt2_belt')}
                    className="cursor-pointer"
                  >
                    <line x1="-120" y1="10" x2="120" y2="10" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 4" />
                    <line x1="-120" y1="40" x2="120" y2="40" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 4" />
                    <rect x="-35" y="16" width="70" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text x="0" y="29" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      CORREIA GT2
                    </text>
                  </g>

                  {/* Motor 775 and Gearbox (Side profile above rear axle) */}
                  <g 
                    onClick={() => setSelectedPart('motor_775')}
                    className="cursor-pointer"
                    transform="translate(-120, -50)"
                  >
                    <circle cx="0" cy="0" r="38" fill="url(#grad-motor)" stroke="#f8fafc" strokeWidth="2" />
                    <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      775
                    </text>
                    <text x="0" y="56" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      Motor Planetário 19.2:1
                    </text>
                  </g>

                  {/* Aerodynamic Locomotive Body Shell Profile */}
                  <path
                    d="M-220,50 L-220,-80 L-100,-115 L140,-115 Q240,-80 240,50 Z"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    opacity="0.4"
                  />
                  {/* Windshield */}
                  <polygon points="120,-105 180,-60 170,-45 110,-95" fill="#38bdf8" opacity="0.15" />

                  {/* Hitch Pins at exactly 107.5 mm from rail */}
                  {/* Rail top = 80. In scale: 107.5 mm = ~100px above rail -> Y = 80 - 100 = -20 */}
                  <g 
                    onClick={() => setSelectedPart('hitch_pin')}
                    className="cursor-pointer"
                  >
                    {/* Rear Hitch (X = -230, Y = -20) */}
                    <rect x="-245" y="-28" width="25" height="16" rx="2" fill="#64748b" stroke="#e2e8f0" strokeWidth="1.5" />
                    <circle cx="-235" cy="-20" r="5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />

                    {/* Front Hitch (X = +230, Y = -20) */}
                    <rect x="220" y="-28" width="25" height="16" rx="2" fill="#64748b" stroke="#e2e8f0" strokeWidth="1.5" />
                    <circle cx="235" cy="-20" r="5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
                  </g>

                  {/* Dimensions on Side View */}
                  {showDimensions && (
                    <g>
                      {/* Cota Altura do Engate: 107.5 mm */}
                      <g stroke="#22c55e" strokeWidth="1.5">
                        <line x1="-250" y1="80" x2="-285" y2="80" />
                        <line x1="-250" y1="-20" x2="-285" y2="-20" />
                        <line x1="-275" y1="80" x2="-275" y2="-20" />
                        <polygon points="-275,80 -271,72 -279,72" fill="#22c55e" />
                        <polygon points="-275,-20 -271,-12 -279,-12" fill="#22c55e" />
                      </g>
                      <rect x="-355" y="20" width="75" height="22" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
                      <text x="-317" y="34" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        107,5 mm
                      </text>
                      <text x="-317" y="47" textAnchor="middle" fill="#86efac" fontSize="7" fontFamily="monospace">
                        (REGRA 3.b: 105-110)
                      </text>

                      {/* Cota Diâmetro da Roda (65 mm) */}
                      <g stroke="#f59e0b" strokeWidth="1.5">
                        <line x1="175" y1="-30" x2="200" y2="-30" />
                        <line x1="175" y1="80" x2="200" y2="80" />
                        <line x1="190" y1="-30" x2="190" y2="80" />
                        <polygon points="190,-30 186,-22 194,-22" fill="#f59e0b" />
                        <polygon points="190,80 186,72 194,72" fill="#f59e0b" />
                      </g>
                      <text x="205" y="30" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Ø 65 mm
                      </text>
                    </g>
                  )}
                </g>
              )}
            </svg>
          </div>
          )}
        </div>

        {/* Dynamic Interactive Component Inspector (Card below canvas) */}
        {activePart && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  {activePart.title}
                </h3>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                {activePart.tag}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activePart.desc}
            </p>

            {/* Technical Specs List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {activePart.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Component Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-mono text-[11px] uppercase mr-1">Clique para inspecionar no desenho:</span>
          {[
            { id: 'motor_775', label: 'Motor DC 775' },
            { id: 'pinion_gear', label: 'Pinhão 15T M1.0' },
            { id: 'driven_gear', label: 'Coroa 45T M1.0' },
            { id: 'gt2_belt', label: 'Correia GT2-380' },
            { id: 'pulley_1', label: 'Polias GT2 30T' },
            { id: 'wheel_gauge', label: '4 Rodas & Bitola 150mm' },
            { id: 'hitch_pin', label: 'Engate 107.5mm' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPart(item.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedPart === item.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
