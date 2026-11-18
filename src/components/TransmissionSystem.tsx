import React, { useState } from 'react';
import { Cog, Activity, ArrowRight, ShieldCheck, Zap, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { TransmissionConfig } from '../types/locomotive';

interface Props {
  config: TransmissionConfig;
  onChangeConfig: (newConfig: TransmissionConfig) => void;
}

export const TransmissionSystem: React.FC<Props> = ({ config, onChangeConfig }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'cad_specs'>('overview');

  // Mechanical Calculations
  const gearRatio = config.drivenGearTeeth / config.motorPinionTeeth; // e.g. 45 / 15 = 3.0
  const totalReductionRatio = config.internalGearboxRatio * gearRatio; // e.g. 19.2 * 3.0 = 57.6:1
  const axleRpm = config.motorRpm / gearRatio; // RPM no eixo das rodas

  // Wheel velocity
  const wheelPerimeterM = (Math.PI * config.wheelDiameterMm) / 1000; // m
  const linearSpeedMs = (axleRpm / 60) * wheelPerimeterM; // m/s
  const linearSpeedKmh = linearSpeedMs * 3.6; // km/h

  // Belt length calculation (GT2 Pitch = 2mm)
  // L = 2*C + PI*(D1 + D2)/2 + (D2 - D1)^2 / (4*C)
  // For 1:1 pulleys, D1 = D2 = (Z * p) / PI
  const pulleyPitchDiamMm = (config.pulleyWheelAxle1Teeth * config.beltPitchMm) / Math.PI; // ~19.1 mm
  const theoreticalBeltLengthMm = 2 * config.wheelbaseMm + Math.PI * pulleyPitchDiamMm; // ~380.0 mm
  const beltTeethCount = Math.round(theoreticalBeltLengthMm / config.beltPitchMm); // e.g. 190 dentes (GT2-380)

  // Torque and Traction calculations
  // Motor 775 nominal torque ~0.1 N.m (before internal gearbox) -> ~1.6 N.m out of planetary 19.2:1
  const motorGearboxTorque = 4.8; // N.m no eixo de saída do redutor planetário 775
  const axleTorqueTotal = motorGearboxTorque * gearRatio * 0.90; // 90% transmission efficiency = ~13.0 N.m
  const wheelRadiusM = (config.wheelDiameterMm / 2) / 1000;
  const tractiveForceN = axleTorqueTotal / wheelRadiusM; // F = T / r = 13.0 / 0.0325 = ~399 N (pico)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cog className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Sistema de Transmissão Mecânica 4WD (Engrenagem + Correia GT2)
              <span className="text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Sincronismo Positivo 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Arquitetura híbrida para acionamento integral das 4 rodas com distância entre eixos de {config.wheelbaseMm} mm
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visão Geral & Vantagens
          </button>
          <button
            onClick={() => setActiveTab('calculations')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'calculations' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Calculadora Cinemática & Dinâmica
          </button>
          <button
            onClick={() => setActiveTab('cad_specs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'cad_specs' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Guia de Montagem & Impressão 3D
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Redução Mecânica Total</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-cyan-400">{totalReductionRatio.toFixed(1)}:1</span>
                  <span className="text-xs text-slate-400">(19.2 x {gearRatio.toFixed(1)})</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Multiplicação de torque de 57 vezes</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Velocidade Linear Máx.</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{linearSpeedMs.toFixed(2)} m/s</span>
                  <span className="text-xs text-slate-400">({linearSpeedKmh.toFixed(1)} km/h)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tempo no tiro 2,5m: ~{(2.5 / linearSpeedMs + 0.4).toFixed(2)}s</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Correia Síncrona GT2</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-amber-400">GT2-{Math.round(theoreticalBeltLengthMm)}</span>
                  <span className="text-xs text-slate-400">({beltTeethCount} dentes)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Largura 9mm com alma de aramida/fibra</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Tração Total nas 4 Rodas</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">4WD / Bo-Bo</span>
                  <span className="text-xs text-emerald-400 font-bold">100% AWD</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Distância entre centros: {config.wheelbaseMm} mm</p>
              </div>
            </div>

            {/* Architecture Explanatory Diagram */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Fluxo de Potência & Por que esta é a Melhor Arquitetura:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
                  <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">ETAPA 1: MOTORIZAÇÃO</div>
                  <h4 className="text-sm font-semibold text-white">Motor 775 + Redutor Planetário</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    O motor DC 775 alimenta a caixa de engrenagens planetárias internas (1:19.2), transformando 6.500 RPM em 340 RPM com torque contínuo elevado (4.8 N.m).
                  </p>
                  <div className="mt-3 text-[11px] font-mono bg-slate-950 p-2 rounded text-slate-300">
                    Eixo de saída: 8mm com chanfro em D
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold mb-1">ETAPA 2: REDUÇÃO CILÍNDRICA</div>
                  <h4 className="text-sm font-semibold text-white">Pinhão 15T → Coroa 45T Módulo 1.0</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Redução primária compacta de 3:1 diretamente montada no Eixo Traseiro (Eixo 1). Feita em Nylon PA12-CF usinado/impresso para baixo ruído e auto-lubrificação.
                  </p>
                  <div className="mt-3 text-[11px] font-mono bg-slate-950 p-2 rounded text-slate-300">
                    RPM Eixo 1: ~113 RPM | Torque: 13.0 N.m
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
                  <div className="text-[11px] font-mono text-amber-400 font-bold mb-1">ETAPA 3: TRAÇÃO INTEGRAL 4x4</div>
                  <h4 className="text-sm font-semibold text-white">Correia Dentada GT2 (Polias 30T 1:1)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Duas polias GT2 de 30 dentes nos eixos 1 e 2 são unidas pela correia dentada GT2 fechada. Transmite 50% da potência ao eixo dianteiro com zero patinagem e amortecimento elástico.
                  </p>
                  <div className="mt-3 text-[11px] font-mono bg-slate-950 p-2 rounded text-slate-300">
                    Wheelbase: 160 mm | Relação 1:1 exata
                  </div>
                </div>
              </div>

              {/* Justification & Defense points for judges */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      Por que NÃO usar trem de 5 engrenagens ou somente correia? (Defesa Técnica para a Banca)
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      <li>
                        <strong>Superação da distância entre eixos ({config.wheelbaseMm} mm):</strong> Ligar dois eixos distantes 160 mm apenas por engrenagens exigiria no mínimo 5 a 6 engrenagens intermediárias. Isso geraria folga angular cumulativa (backlash excessivo), peso inútil (+450g) e alto risco de um dente quebrar sob o tranco do Cabo de Guerra.
                      </li>
                      <li>
                        <strong>Amortecimento de choque torcional:</strong> A correia dentada GT2 de borracha sintética reforçada com fibra age como um filtro mecânico, protegendo o redutor planetário e os dentes plásticos contra sobrecargas repentinas na partida com 20 kg de carga.
                      </li>
                      <li>
                        <strong>Rendimento Superior:</strong> A correia dentada síncrona tem eficiência de 98%, muito superior ao atrito gerado por múltiplos pares de dentes de engrenagens em cascata.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parameter Sliders */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Ajuste de Parâmetros da Transmissão
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dentes do Pinhão do Motor (Z1):</span>
                      <span className="font-mono font-bold text-cyan-400">{config.motorPinionTeeth}T</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={config.motorPinionTeeth}
                      onChange={(e) =>
                        onChangeConfig({ ...config, motorPinionTeeth: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dentes da Engrenagem do Eixo (Z2):</span>
                      <span className="font-mono font-bold text-cyan-400">{config.drivenGearTeeth}T</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="60"
                      step="3"
                      value={config.drivenGearTeeth}
                      onChange={(e) =>
                        onChangeConfig({ ...config, drivenGearTeeth: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dentes das Polias GT2 (Eixo 1 & 2):</span>
                      <span className="font-mono font-bold text-amber-400">{config.pulleyWheelAxle1Teeth}T</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="40"
                      step="2"
                      value={config.pulleyWheelAxle1Teeth}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          pulleyWheelAxle1Teeth: parseInt(e.target.value),
                          pulleyWheelAxle2Teeth: parseInt(e.target.value)
                        })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Distância entre Eixos (Wheelbase C):</span>
                      <span className="font-mono font-bold text-emerald-400">{config.wheelbaseMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="190"
                      step="5"
                      value={config.wheelbaseMm}
                      onChange={(e) =>
                        onChangeConfig({ ...config, wheelbaseMm: parseInt(e.target.value) })
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Diâmetro da Roda Ferroviária (D):</span>
                      <span className="font-mono font-bold text-purple-400">{config.wheelDiameterMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="80"
                      step="2"
                      value={config.wheelDiameterMm}
                      onChange={(e) =>
                        onChangeConfig({ ...config, wheelDiameterMm: parseInt(e.target.value) })
                      }
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Results & Math Formulas */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Memorial de Cálculo Matemático
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">1. Relação de Transmissão por Engrenagens:</div>
                    <div className="text-white mt-1">
                      i_eng = Z2 / Z1 = {config.drivenGearTeeth} / {config.motorPinionTeeth} = <strong className="text-cyan-400">{gearRatio.toFixed(2)}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      i_total = i_planetaria ({config.internalGearboxRatio}) × {gearRatio.toFixed(2)} = <strong className="text-cyan-400">{totalReductionRatio.toFixed(2)}:1</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">2. Rotação do Rodeiro & Velocidade no Trilho:</div>
                    <div className="text-white mt-1">
                      n_roda = n_motor / i_eng = {config.motorRpm} / {gearRatio.toFixed(2)} = <strong className="text-emerald-400">{axleRpm.toFixed(1)} RPM</strong>
                    </div>
                    <div className="text-slate-300 mt-1">
                      v = (n_roda / 60) × π × D = <strong className="text-emerald-400">{linearSpeedMs.toFixed(2)} m/s ({linearSpeedKmh.toFixed(1)} km/h)</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">3. Dimensionamento da Correia Dentada GT2:</div>
                    <div className="text-white mt-1">
                      Dp = (Z × p) / π = ({config.pulleyWheelAxle1Teeth} × 2) / π = <strong className="text-amber-400">{pulleyPitchDiamMm.toFixed(2)} mm</strong>
                    </div>
                    <div className="text-slate-300 mt-1">
                      L_teorico = 2 × {config.wheelbaseMm} + π × {pulleyPitchDiamMm.toFixed(2)} = <strong className="text-amber-400">{theoreticalBeltLengthMm.toFixed(1)} mm ({beltTeethCount}T)</strong>
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1">
                      → Correia padrão comercial correspondente: <strong>GT2-380</strong> ou <strong>GT2-384</strong> (largura 9mm).
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">4. Força Tratora Teórica Máxima (Drawbar Pull):</div>
                    <div className="text-white mt-1">
                      T_eixo = {motorGearboxTorque} N.m × {gearRatio.toFixed(2)} × 0.90 = <strong className="text-purple-400">{axleTorqueTotal.toFixed(2)} N.m</strong>
                    </div>
                    <div className="text-slate-300 mt-1">
                      F_tracao = T_eixo / Raio = {axleTorqueTotal.toFixed(2)} / {(wheelRadiusM).toFixed(4)} = <strong className="text-purple-400">{tractiveForceN.toFixed(0)} N (~{(tractiveForceN / 9.81).toFixed(1)} kgf)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cad_specs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Print Specs */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Especificações para Impressão 3D das Engrenagens e Polias
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white">Engrenagem Cilíndrica M1.0 (45 dentes)</div>
                    <div className="text-slate-400 mt-1">
                      Material recomendado: <strong>Nylon PA12 ou POM (Poliacetal) / Resina Tough</strong>
                    </div>
                    <div className="text-slate-400">
                      Parâmetros: 100% Infill concêntrico, 5 perímetros, altura de camada 0.12mm.
                    </div>
                    <div className="text-emerald-400 font-mono mt-1">Furo central 8mm com chaveta 2x2mm</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white">Polias Sincronizadoras GT2 (30 dentes)</div>
                    <div className="text-slate-400 mt-1">
                      Material: <strong>PETG ou Alumínio CNC comercial (Polia GT2 30T furo 8mm)</strong>
                    </div>
                    <div className="text-slate-400">
                      Flange lateral dupla para impedir escape da correia sob vibração.
                    </div>
                    <div className="text-amber-400 font-mono mt-1">Parafuso sem cabeça M4 para travamento no eixo</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white">Mancais de Rolamento do Chassi</div>
                    <div className="text-slate-400 mt-1">
                      4x Rolamentos de esferas com flange <strong>F688ZZ (8x16x5mm)</strong> ou <strong>608ZZ (8x22x7mm)</strong>
                    </div>
                    <div className="text-slate-400">
                      Alojamento no chassi com tolerância H7 (+0.05mm) e travas parafusadas.
                    </div>
                  </div>
                </div>
              </div>

              {/* Assembly Procedure */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Roteiro de Montagem Passo a Passo (Transmissão)
                </h3>
                <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside">
                  <li className="p-2 rounded bg-slate-900">
                    <strong className="text-white">Prensa dos Rolamentos:</strong> Inserir os 4 rolamentos 608ZZ nos berços do chassi inferior impresso em PETG/PA-CF.
                  </li>
                  <li className="p-2 rounded bg-slate-900">
                    <strong className="text-white">Montagem do Eixo 1 (Traseiro):</strong> Deslizar a roda esquerda (150mm gauge), a engrenagem 45T, a polia GT2 30T e a roda direita no eixo de aço SAE 1045 de 8mm.
                  </li>
                  <li className="p-2 rounded bg-slate-900">
                    <strong className="text-white">Instalação da Correia GT2:</strong> Enlaçar a correia GT2 fechada (GT2-380) na polia do Eixo 1 e na polia do Eixo 2 antes de fixar os mancais dianteiros.
                  </li>
                  <li className="p-2 rounded bg-slate-900">
                    <strong className="text-white">Ajuste de Tensão:</strong> Regular o parafuso do tensionador excêntrico com rolamento 624ZZ até a correia atingir deflexão de ~2mm sob força leve de 5N.
                  </li>
                  <li className="p-2 rounded bg-slate-900">
                    <strong className="text-white">Acoplamento do Motor 775:</strong> Fixar o motor 775 no suporte frontal ajustável, engrazando o pinhão 15T na engrenagem 45T com folga de papel (0.08mm) e lubrificar com graxa branca PTFE.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
