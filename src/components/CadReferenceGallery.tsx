import React, { useState } from 'react';
import { Camera, Image as ImageIcon, ZoomIn, X, ExternalLink, Compass, Download, Sparkles } from 'lucide-react';
import { USER_CAD_SCREENSHOTS } from '../data/locomotiveData';

export const CadReferenceGallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeVisualTab, setActiveVisualTab] = useState<'illustration' | 'render'>('illustration');

  const isIllustrated = selectedImage === '/assets/locomotive_technical_illustration.jpg';
  const isRealistic = selectedImage === '/assets/locomotive_mechanism_realistic.jpg';

  const activeImageData = isIllustrated
    ? {
        title: 'Novo Desenho Técnico Ilustrado — Corte Isométrico do Mecanismo 4WD',
        desc: 'Ilustração mecânica detalhada com grid de engenharia exibindo o corte aerodinâmico da carcaça, o motor DC RS-775 transversal com redutor planetário, o pinhão de latão 15T engrazando na coroa 45T, a correia sincronizadora dentada GT2 fechada (1:1) unindo os eixos em 160 mm de entre-eixos e os 4 rodeiros cônicos de aço na bitola oficial de 150 mm.'
      }
    : isRealistic
    ? {
        title: 'Renderização Foto-Realista de Engenharia — Mecanismo 4WD',
        desc: 'Visualização foto-realista em corte demonstrando a integração do motor DC 775, planetária metálica, pinhão 15T, coroa 45T, correia GT2 fechada e os 4 rodeiros sobre trilhos com bitola regulamentar de 150 mm.'
      }
    : USER_CAD_SCREENSHOTS.find((img) => img.path === selectedImage);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Galeria de Ilustrações, Renderizações & Modelagem CAD (Onshape)
              <span className="text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Prints & Diagramas
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Registros da geometria 3D, corte mecânico do sistema 4WD, bitola de 150 mm e cavidades internas de transmissão
            </p>
          </div>
        </div>

        {/* Tab Switcher for Main Artwork */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveVisualTab('illustration')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeVisualTab === 'illustration'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Novo Desenho Ilustrado (Corte Isométrico)
          </button>
          <button
            onClick={() => setActiveVisualTab('render')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeVisualTab === 'render'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Renderização Foto-Realista
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Featured Visual Hero Card (Swappable between New Illustration and Realistic Render) */}
        {activeVisualTab === 'illustration' ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Novo Desenho Técnico Ilustrado de Engenharia (Corte Isométrico 4WD)
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">
                    Ilustração de Precisão • Grid ABNT
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/assets/locomotive_technical_illustration.jpg"
                  download="Locomotiva_Desenho_Tecnico_Ilustrado_4WD.jpg"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Imagem HD
                </a>
                <button
                  onClick={() => setSelectedImage('/assets/locomotive_technical_illustration.jpg')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Ampliar em Tela Cheia
                </button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedImage('/assets/locomotive_technical_illustration.jpg')}
              className="group relative cursor-pointer aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner"
            >
              <img
                src="/assets/locomotive_technical_illustration.jpg"
                alt="Novo Desenho Técnico Ilustrado da Locomotiva Cavalos de Ferro 2026"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-cyan-400 font-mono uppercase">
                    ISOMÉTRICA DO CORTE DO TREM DE FORÇA • BITOLA 150 MM
                  </span>
                  <p className="text-xs text-slate-200">
                    Carenagem azul em corte translúcido com vista explodida: Motor RS-775 com redutor planetário, pinhão 15T e coroa 45T M1.0, correia dentada GT2 unindo os eixos em 160 mm de wheelbase e rodeiros com bitola de 150 mm.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Callouts on New Illustration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Motor Transversal:</span>
                <span className="font-bold text-amber-400">RS-775 + Planetária 19.2:1</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Engrenagens M1.0:</span>
                <span className="font-bold text-cyan-400">15T Latão → 45T Nylon (3:1)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Correia Dentada:</span>
                <span className="font-bold text-emerald-400">GT2-380 Síncrona 1:1</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Bitola dos Trilhos:</span>
                <span className="font-bold text-purple-400">150,0 mm Regulamentar</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Renderização Foto-Realista de Engenharia (Corte do Mecanismo 4WD)
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">
                    Foto-Realista • Octane Render
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/assets/locomotive_mechanism_realistic.jpg"
                  download="Locomotiva_Render_Realista_4WD.jpg"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Imagem HD
                </a>
                <button
                  onClick={() => setSelectedImage('/assets/locomotive_mechanism_realistic.jpg')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Ampliar em Tela Cheia
                </button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedImage('/assets/locomotive_mechanism_realistic.jpg')}
              className="group relative cursor-pointer aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner"
            >
              <img
                src="/assets/locomotive_mechanism_realistic.jpg"
                alt="Render Realista da Locomotiva Cavalos de Ferro 2026 com Transmissão Visível"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-cyan-400 font-mono uppercase">
                    MECANISMO 4WD INTEGRAL SINCRONIZADO
                  </span>
                  <p className="text-xs text-slate-200">
                    Corte translúcido exibindo o Motor DC 775, pinhão 15T engrazando na coroa 45T, correia dentada GT2 unindo os dois eixos sobre trilhos na bitola de 150 mm.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Callouts on Realistic Image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Motorização:</span>
                <span className="font-bold text-amber-400">RS-775 Planetário</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Redução Eixo 1:</span>
                <span className="font-bold text-cyan-400">15T → 45T (3:1)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Correia Síncrona:</span>
                <span className="font-bold text-emerald-400">GT2-380 (1:1 AWD)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Bitola dos Trilhos:</span>
                <span className="font-bold text-purple-400">150,0 mm Oficial</span>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800/80 pt-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Capturas Originais do Modelo CAD 3D (Onshape):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USER_CAD_SCREENSHOTS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item.path)}
              className="group cursor-pointer rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                <img
                  src={item.path}
                  alt={item.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5" /> Ampliar Vista
                  </span>
                </div>
              </div>

              <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60">
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Modal Zoom Viewer */}
      {selectedImage && activeImageData && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">{activeImageData.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage}
                  download="Imagem_Locomotiva.jpg"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors"
                  title="Baixar imagem"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedImage}
                alt={activeImageData.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-inner"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeImageData.desc}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <span>Bitola de 150 mm respeitada nos apoios inferiores</span>
                <span>•</span>
                <span>Canal central livre para a correia sincronizadora GT2</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
