import React, { useState } from 'react';
import { FileText, Printer, Award, Clock, DollarSign, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { LocomotiveSpecs, TransmissionConfig } from '../types/locomotive';

interface Props {
  specs: LocomotiveSpecs;
  transmission: TransmissionConfig;
}

export const TechnicalReport: React.FC<Props> = ({ specs, transmission }) => {
  const [activeSection, setActiveSection] = useState<'pitch' | 'memorial' | 'bom'>('pitch');

  const handlePrint = () => {
    window.print();
  };

  const billOfMaterials = [
    { item: 'Motor DC 775 com Redutor Planetário Metálico 1:19.2 (12-24V)', qty: 1, category: 'Motorização', costBrl: 165.0, source: 'Mercado Livre / AliExpress' },
    { item: 'Driver Ponte H BTS7960 43A (IBT-2) com Dissipador', qty: 1, category: 'Eletrônica', costBrl: 45.0, source: 'RoboCore / CurtoCircuito' },
    { item: 'Bateria LiPo 4S 14.8V 5200mAh 50C com Plug XT60', qty: 1, category: 'Alimentação', costBrl: 220.0, source: 'HobbyKing / Mercado Livre' },
    { item: 'Par de Polias Sincronizadoras GT2 30 Dentes (Furo 8mm)', qty: 2, category: 'Transmissão', costBrl: 38.0, source: 'Makers / 3D Fila' },
    { item: 'Correia Dentada Fechada GT2-380 (Largura 9mm, Alma de Fibra)', qty: 1, category: 'Transmissão', costBrl: 22.0, source: 'Makers / Mercado Livre' },
    { item: 'Par de Engrenagens Cilíndricas Retas M1.0 (Pinhão 15T e Coroa 45T)', qty: 1, category: 'Transmissão', costBrl: 55.0, source: 'Impressão 3D Nylon / Usinada' },
    { item: 'Eixos de Aço SAE 1045 Retificado 8mm x 200mm', qty: 2, category: 'Mecânica', costBrl: 30.0, source: 'Casa do Aço / Mercado Livre' },
    { item: 'Rolamentos Blindados 608ZZ / F688ZZ com Flange', qty: 4, category: 'Mecânica', costBrl: 24.0, source: 'SMR Rolamentos' },
    { item: '4 Rodas Ferroviárias Perfil Cônico Bitola 150mm c/ Anel O-ring PU', qty: 4, category: 'Mecânica', costBrl: 40.0, source: 'Impressão 3D PETG + Torno' },
    { item: 'Filamento PETG / PA12-CF para Chassi e Carenagem (2.5 kg)', qty: 1, category: 'Manufatura 3D', costBrl: 240.0, source: '3D Fila / Voolt3D' },
    { item: 'Microcontrolador ESP32 + Receptor RC 2.4GHz FlySky', qty: 1, category: 'Controle', costBrl: 85.0, source: 'Mercado Livre' },
    { item: 'Pino de Engate em Aço 6mm (Altura 107.5 mm) e Suporte', qty: 2, category: 'Mecânica', costBrl: 18.0, source: 'Oficina Mecânica' },
    { item: 'Lastro de Chumbo / Esferas de Aço (2.9 kg centralizado)', qty: 1, category: 'Estrutural', costBrl: 65.0, source: 'Chumbada Pesca / Sucata' },
    { item: 'Parafusos Allen M3/M4, Porcas Nyloc e Insertos Roscados de Latão', qty: 1, category: 'Fixação', costBrl: 35.0, source: 'Casa dos Parafusos' }
  ];

  const totalCost = billOfMaterials.reduce((acc, curr) => acc + curr.costBrl, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Memorial Descritivo & Roteiro de Defesa de Projeto
              <span className="text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Item 4.1 do Edital (10 Minutos)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Documentação oficial para apresentação à banca avaliadora (Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Section Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('pitch')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSection === 'pitch' ? 'bg-blue-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pitch de Defesa (10 min)
            </button>
            <button
              onClick={() => setActiveSection('memorial')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSection === 'memorial' ? 'bg-blue-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Memorial de Cálculo
            </button>
            <button
              onClick={() => setActiveSection('bom')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSection === 'bom' ? 'bg-blue-500 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lista de Compras (BOM)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* --- 10-MINUTE DEFENSE PITCH GUIDE --- */}
        {activeSection === 'pitch' && (
          <div className="space-y-6">
            {/* Criteria Banner */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-300 font-semibold">
                <Award className="w-4 h-4 text-blue-400" />
                Critérios Oficiais Avaliados pela Banca (Notas de 0 a 10 cada):
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                  1. Construção & Dimensões (0-10)
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                  2. Sistemas Mecânico & Elétrico (0-10)
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                  3. Criatividade & Estética (0-10)
                </span>
              </div>
            </div>

            {/* Pitch Timeline */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> MINUTO 0:00 A 2:00
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Introdução & Conceito Aerodinâmico</span>
                </div>
                <h4 className="text-sm font-bold text-white">Apresentação da Equipe & Filosofia do Projeto</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Bom dia à banca avaliadora. Apresentamos a nossa locomotiva projetada sob medida para as 4 provas do Cavalos de Ferro 2026 (conforme Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf). Nosso objetivo não foi apenas atender os limites do edital, mas explorar a física limite do ferromodelismo: bitola rigorosa de 150 mm, altura de engate cravada em 107.5 mm e massa calculada em 7.650 gramas para atrito máximo sem nenhuma penalidade."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> MINUTO 2:00 A 5:00
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Sistemas Mecânicos & Tração 4x4</span>
                </div>
                <h4 className="text-sm font-bold text-white">Transmissão Híbrida: Por que Engrenagem + Correia GT2?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "O coração do nosso protótipo é a transmissão integral 4WD. O motor DC 775 conta com redutor planetário interno metálico 19.2:1, acoplado a um par de engrenagens cilíndricas retas de módulo 1.0 (15T e 45T, redução 3:1) no eixo traseiro. Para transmitir essa potência para as 4 rodas separadas por 160 mm de distância entre eixos, optamos por uma correia dentada síncrona GT2 reforçada com polias 30T 1:1. Essa solução elimina o peso e a folga de 5 engrenagens intermediárias, absorve os trancos torcionais do cabo de guerra e garante que todas as 4 rodas tracionem simultaneamente sem patinar."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> MINUTO 5:00 A 7:30
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Sistema Elétrico Embarcado & Impressão 3D</span>
                </div>
                <h4 className="text-sm font-bold text-white">Alimentação Autônoma, Driver 43A e DFM</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Conforme o artigo 3.h, operamos de forma 100% autônoma através de uma bateria LiPo 4S de 14.8V e 5200mAh com taxa de descarga contínua de 50C, alimentando um driver Ponte H BTS7960 de 43A com dissipação ativa. Toda a estrutura do chassi foi fabricada em manufatura aditiva 3D em PETG e PA-CF, com 5 perímetros e 70% de infill gyroid. Para atender à regra 3.g de zero peças soltas, todas as uniões utilizam insertos de latão termofixados e porcas autotravantes Nyloc com Loctite."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> MINUTO 7:30 A 10:00
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Estratégia de Prova & Arguição da Banca</span>
                </div>
                <h4 className="text-sm font-bold text-white">Desempenho nas 4 Provas & Conclusão</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Com este conjunto, nossa força de empuxo trator chega a 48.8 N nos trilhos, permitindo puxar os 20 kg no Helpers com tranquilidade, vencer a rampa de 20° sem recuo e garantir tração superior no Cabo de Guerra. Estamos à disposição para as perguntas da banca."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- MEMORIAL DE CÁLCULO FORMAL --- */}
        {activeSection === 'memorial' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 font-mono text-xs text-slate-300">
              <div className="text-cyan-400 font-bold text-sm uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
                Memorial Descritivo de Dimensionamento Mecânico & Dinâmico
              </div>

              <div className="space-y-2">
                <div className="text-white font-bold font-sans">1. Geometria Regulamentar & Tolerâncias Construtivas</div>
                <p className="font-sans text-slate-400">
                  Bitola nominal das rodas (eixo a eixo de contato): <strong>150,0 mm ± 0,2 mm</strong>.<br />
                  Diâmetro de rolamento dos rodeiros: <strong>D = 65,0 mm</strong> (Raio r = 0,0325 m).<br />
                  Distância entre centros dos eixos (Wheelbase): <strong>C = 160,0 mm</strong>.<br />
                  Altura do pino de engate (medido do topo do boleto do trilho): <strong>h = 107,5 mm</strong> (Faixa permitida: 105 a 110 mm).<br />
                  Dimensões envolventes totais: <strong>335 mm (C) × 205 mm (L) × 245 mm (A)</strong>. (Todos rigorosamente inferiores aos tetos de 360, 220 e 330 mm).
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-white font-bold font-sans">2. Cinemática da Transmissão (Engrenagens & Correia GT2)</div>
                <p className="font-sans text-slate-400">
                  • Rotação do motor DC 775 sob 14.8V: <strong>N_motor = 6.500 RPM</strong>.<br />
                  • Redução planetária metálica de 1º estágio: <strong>i_planet = 19,2:1</strong>.<br />
                  • Rotação do eixo do redutor: N_red = 6.500 / 19,2 = <strong>338,5 RPM</strong>.<br />
                  • Relação do par cilíndrico de 2º estágio (Pinhão 15T e Coroa 45T Módulo 1.0): <strong>i_eng = 45 / 15 = 3,0:1</strong>.<br />
                  • Rotação final nos eixos dos rodeiros: N_roda = 338,5 / 3,0 = <strong>112,8 RPM</strong>.<br />
                  • Relação da correia dentada GT2 (Polia 1 = 30T, Polia 2 = 30T): <strong>i_correia = 1:1 (Sincronismo total)</strong>.<br />
                  • Perímetro da roda: S = π × D = 3,14159 × 0,065 = <strong>0,2042 m/volta</strong>.<br />
                  • Velocidade linear da locomotiva: v = (112,8 / 60) × 0,2042 = <strong>1,05 m/s (~3,8 km/h)</strong>.<br />
                  • Tempo estimado para percorrer os 2.500 mm (Prova de Aceleração 4.4): <strong>t = 2,5 / 1,05 + 0,35s (arrancada) = 2,73 s</strong>.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-white font-bold font-sans">3. Dinâmica de Tração, Torque & Limite de Aderência Roda-Trilho</div>
                <p className="font-sans text-slate-400">
                  • Torque nominal na saída da planetária: <strong>T_red = 4,8 N.m</strong>.<br />
                  • Torque total multiplicado nos rodeiros (eficiência η = 90%): T_eixo = 4,8 × 3,0 × 0,90 = <strong>12,96 N.m</strong>.<br />
                  • Força tratora máxima teórica gerada pelo trem de força: F_tracao = T_eixo / r = 12,96 / 0,0325 = <strong>398,7 N</strong>.<br />
                  • Massa total da locomotiva lastrada: <strong>m = 7,65 kg</strong> (Força normal total Fn = 7,65 × 9,81 = <strong>75,05 N</strong>).<br />
                  • Coeficiente de atrito estático com anel de poliuretano 70A sobre trilho: <strong>μ = 0,65</strong>.<br />
                  • Força máxima de tração sem patinamento (Limite de Coulomb): Fat_max = μ × Fn = 0,65 × 75,05 = <strong>48,78 N (~4,97 kgf de empuxo limpo)</strong>.<br />
                  • Como a força tratora do motor (398 N) é muito superior à força de aderência limite (48,8 N), o motor opera com folga térmica absoluta sem risco de stall prematuro.<br />
                  • <strong>Arquivo de referência utilizado:</strong> Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf (Itens 3 e 4).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- BILL OF MATERIALS (BOM) --- */}
        {activeSection === 'bom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Lista de Componentes, Fornecedores e Custos Reais
              </div>
              <div className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg text-emerald-400 font-bold">
                CUSTO TOTAL ESTIMADO: R$ {totalCost.toFixed(2)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-2.5 px-3">Item / Componente</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Qtd</th>
                    <th className="py-2.5 px-3">Fornecedor / Fabricação</th>
                    <th className="py-2.5 px-3 text-right">Custo Est. (BRL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {billOfMaterials.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 font-medium text-white">{row.item}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.qty}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.source}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                        R$ {row.costBrl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
