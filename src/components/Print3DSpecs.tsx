import React, { useState } from 'react';
import { Printer, Layers, Box, Wrench, Shield, CheckCircle2, FileText, Download } from 'lucide-react';

export const Print3DSpecs: React.FC = () => {
  const [selectedPart, setSelectedPart] = useState<'chassis' | 'gears' | 'pulleys' | 'shell' | 'wheels'>('chassis');

  const partDetails = {
    chassis: {
      name: 'Chassi Estrutural Inferior & Mancais de Rolamento',
      material: 'PETG ou PA12-CF (Nylon com Fibra de Carbono)',
      infill: '60% a 75% Gyroid (isotrópico contra torção)',
      walls: '5 perímetros (espessura de parede ~2.4 mm)',
      topBottom: '6 camadas superiores e 6 inferiores',
      layerHeight: '0.20 mm',
      printTime: '~14 horas',
      mass: '~1.450 g',
      notes: [
        'Imprimir com a base plana apoiada na mesa para máxima aderência e resistência mecânica ao longo do eixo longitudinal de tração.',
        'Alojamentos dos 4 rolamentos 608ZZ modelados com diâmetro de 22.05 mm (+0.05 mm para ajuste prensa leve com interferência).',
        'Usar insertos roscados de latão M3 e M4 termofixados com ferro de solda a 220°C para fixação do berço do motor 775 e tampas dos mancais.',
        'Compartimento de lastro integrado no centro de gravidade (rebaixado) para receber esferas de aço ou placas de chumbo.'
      ]
    },
    gears: {
      name: 'Engrenagem Cilíndrica M1.0 (45 dentes) & Pinhão',
      material: 'Nylon PA6/PA12, POM (Poliacetal) ou Resina Tough',
      infill: '100% Sólido (Infill Concêntrico)',
      walls: 'Perímetros contínuos em toda a coroa dentada',
      topBottom: '100% de preenchimento nos dentes',
      layerHeight: '0.12 mm (para precisão milimétrica da envolvente do dente)',
      printTime: '~2.5 horas',
      mass: '~45 g',
      notes: [
        'A envolvente dos dentes exige velocidade de impressão baixa (25 a 35 mm/s) e ventilação adequada.',
        'Furo de 8 mm com chaveteiro integrado para fixação no eixo de aço SAE 1045.',
        'Aplicar uma fina camada de graxa sintética PTFE (graxa branca) durante a montagem para eliminar atrito e ruído.',
        'Nunca usar PLA puro para engrenagens sob carga pesada contínua, pois a temperatura de transição vítrea (Tg ~55°C) causará deformação.'
      ]
    },
    pulleys: {
      name: 'Polias Sincronizadoras GT2 (30T furo 8mm)',
      material: 'PETG / ASA ou Alumínio Usinado Comercial',
      infill: '100% Sólido',
      walls: '4 a 5 perímetros',
      topBottom: '5 camadas',
      layerHeight: '0.16 mm',
      printTime: '~1.5 horas cada',
      mass: '~25 g cada',
      notes: [
        'Flanges laterais de contenção de 1.5 mm para garantir que a correia GT2 de 9 mm não escape em desníveis dos trilhos.',
        'Alojamento sextavado para porca M4 ou rosca direta com parafuso allen sem cabeça (grub screw) para fixação rígida no eixo.',
        'Verificar tolerância do passo de 2.0 mm com paquímetro antes da montagem definitiva.'
      ]
    },
    shell: {
      name: 'Carenagem Aerodinâmica (Carcaça Externa com Janelas)',
      material: 'PLA+ / PLA Silk / PETG (Sky Blue metálico)',
      infill: '15% a 20% Grid ou Gyroid',
      walls: '3 perímetros (parede de 1.2 mm)',
      topBottom: '4 camadas superiores e 4 inferiores',
      layerHeight: '0.20 mm a 0.28 mm (com Adaptive Layers nas curvas)',
      printTime: '~16 horas (dividida em 2 partes)',
      mass: '~950 g',
      notes: [
        'Divisão para mesas de impressão padrão (ex: 220x220 mm): a carenagem pode ser impressa em 2 metades (Frontal e Traseira) unidas por encaixe macho-fêmea (dowel pins de 4mm) e coladas com cianoacrilato.',
        'Usar suportes em árvore (Tree / Organic Supports) apenas sob o arco das janelas e para-brisa frontal.',
        'Acabamento com lixa fina d\'água (grãos 400 a 1200) e verniz automotivo para nota máxima no critério "Estética e Acabamento" da banca examinadora (Regulamento 4.1).'
      ]
    },
    wheels: {
      name: 'Rodeiros Ferroviários (Perfil Cônico 65mm + Friso 150mm Gauge)',
      material: 'Miolo em PETG/Nylon + Inserto de Borracha/PU no Boleto',
      infill: '100% Concêntrico',
      walls: '6 perímetros',
      topBottom: '100% sólido',
      layerHeight: '0.12 mm',
      printTime: '~3 horas o conjunto de 4 rodas',
      mass: '~180 g (conjunto)',
      notes: [
        'Banda de rodagem com canal rebaixado de 2.5 mm de profundidade para alojar anel o-ring de poliuretano 70A (eleva o atrito de 0.15 para 0.65 nos trilhos metálicos).',
        'Friso interno com altura de 4.0 mm e ângulo de escape de 12° conforme norma ferromodelística NEM 310 / AREMA adaptada para bitola 150 mm.',
        'Tolerância do furo central de 8 mm com chaveta ou pino elástico transversal de 2.5 mm para travar a rotação no eixo de tração.'
      ]
    }
  };

  const current = partDetails[selectedPart];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Diretrizes de Manufatura Aditiva & Impressão 3D (FDM)
              <span className="text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Pronto para Fatiamento (Cura / PrusaSlicer / Orca)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Parametrização mecânica de camadas, infill e materiais para suportar as tensões das provas
            </p>
          </div>
        </div>

        {/* Part Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedPart('chassis')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedPart === 'chassis' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chassi & Mancais
          </button>
          <button
            onClick={() => setSelectedPart('gears')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedPart === 'gears' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Engrenagem M1.0
          </button>
          <button
            onClick={() => setSelectedPart('pulleys')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedPart === 'pulleys' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Polias GT2
          </button>
          <button
            onClick={() => setSelectedPart('wheels')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedPart === 'wheels' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rodas (150mm)
          </button>
          <button
            onClick={() => setSelectedPart('shell')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedPart === 'shell' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Carenagem Aerodinâmica
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Selected Part Card */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                COMPONENTE SELECIONADO:
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{current.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-slate-300">
                Massa estimada: <strong className="text-cyan-400">{current.mass}</strong>
              </span>
              <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-slate-300">
                Tempo de impressão: <strong className="text-amber-400">{current.printTime}</strong>
              </span>
            </div>
          </div>

          {/* Slicer Settings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400">Filamento Indicado:</span>
              <div className="font-semibold text-white mt-1 text-xs">{current.material}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400">Densidade de Preenchimento:</span>
              <div className="font-mono font-bold text-cyan-400 mt-1 text-xs">{current.infill}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400">Perímetros de Parede:</span>
              <div className="font-mono font-bold text-amber-400 mt-1 text-xs">{current.walls}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400">Altura de Camada:</span>
              <div className="font-mono font-bold text-emerald-400 mt-1 text-xs">{current.layerHeight}</div>
            </div>
          </div>

          {/* Detailed Engineering Notes */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Recomendações Práticas de Fatiamento & Pós-Processamento:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {current.notes.map((note, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Universal DFM (Design for Additive Manufacturing) Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Tolerâncias de Encaixe
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para eixos de 8mm e rolamentos de 22mm, aplicar compensação de furo (Hole XY Compensation) de <strong>+0.10 mm</strong> no fatiador para compensar a expansão térmica do plástico.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Orientação das Fibras
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              As linhas de camada (Z) nunca devem ficar perpendiculares à linha de tração do engate. O engate e os mancais devem ser impressos na horizontal para que as camadas recebam tração pura (no plano XY), onde o filamento tem 100% de resistência.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Box className="w-4 h-4" /> Fixação Anti-Partes Soltas
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Em conformidade com a <strong>Regra 3.g</strong> (peças soltas reprovam a equipe), todas as porcas devem ter insertos roscados soldados ou porcas autotravantes com anel de nylon (Nyloc) e trava-rosca químico de média resistência (Loctite 242).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
