import React, { useRef, useState } from 'react';
import { 
  FileDown, 
  Printer, 
  X, 
  CheckCircle2, 
  Award, 
  Train, 
  Cog, 
  Zap, 
  Target, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Loader2,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Download,
  Info,
  ChevronDown,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { LocomotiveSpecs, TransmissionConfig, MotorOption } from '../types/locomotive';
import { REGULATION_RULES, MOTOR_OPTIONS } from '../data/locomotiveData';

export interface DossierPageInfo {
  index: number;
  pageNumber: number;
  title: string;
  code: string;
  shortLabel: string;
  badge: string;
  description: string;
}

export const DOSSIER_PAGES: DossierPageInfo[] = [
  { 
    index: 0, 
    pageNumber: 1, 
    title: 'Capa Oficial & Desenho do Mecanismo em Corte 4WD', 
    code: 'Capa_Ilustracao_4WD', 
    shortLabel: 'Pág 1: Capa & Ilustração', 
    badge: 'Capa Oficial',
    description: 'Cabeçalho oficial, identificação da equipe, título do projeto e ilustração técnica isométrica em corte 3D.'
  },
  { 
    index: 1, 
    pageNumber: 2, 
    title: 'Ficha Técnica, Especificações & Itens do Edital 2026', 
    code: 'Ficha_Tecnica_Edital', 
    shortLabel: 'Pág 2: Ficha Técnica & Edital', 
    badge: 'Regulamento',
    description: 'Tabela de conformidade com os 8 requisitos do Item 3 do Edital, bitola 150mm, peso 7,65kg e altura do engate 107,5mm.'
  },
  { 
    index: 2, 
    pageNumber: 3, 
    title: 'Prancha Técnica 01 — Desenho de Funcionamento 2D & Cotas', 
    code: 'Desenho_Tecnico_2D', 
    shortLabel: 'Pág 3: Desenho Técnico 2D', 
    badge: 'Prancha 2D',
    description: 'Vista lateral, superior e frontal com cotas milimétricas reais, eixos de 150mm e cinemática 4WD vetorial.'
  },
  { 
    index: 3, 
    pageNumber: 4, 
    title: 'Memorial de Transmissão 4x4 (Engrenagens M1.0 + Correia GT2)', 
    code: 'Transmissao_Mecanica_4x4', 
    shortLabel: 'Pág 4: Transmissão 4x4', 
    badge: 'Cinemática',
    description: 'Dimensionamento das engrenagens cilíndricas M1.0 (15T/45T), correia GT2 fechada (380mm), torque de 12,96 N.m e 1,05 m/s.'
  },
  { 
    index: 4, 
    pageNumber: 5, 
    title: 'Análise de Desempenho nas 4 Provas Oficiais (Arrasto, Helpers, Rampa)', 
    code: 'Desempenho_4_Provas', 
    shortLabel: 'Pág 5: 4 Provas Oficiais', 
    badge: 'Dinâmica',
    description: 'Cálculo de adesão no Cabo de Guerra, tração na prova Helpers 20kg, subida na Rampa 20° e parada com partida em rampa.'
  },
  { 
    index: 5, 
    pageNumber: 6, 
    title: 'Manufatura Aditiva 3D & Lista Completa de Materiais (BOM)', 
    code: 'Impressao_3D_BOM', 
    shortLabel: 'Pág 6: Impressão 3D & BOM', 
    badge: 'Manufatura',
    description: 'Filamento PETG, infill gyroid 70%, insertos roscados M3/M4 de latão e orçamento detalhado de componentes.'
  },
  { 
    index: 6, 
    pageNumber: 7, 
    title: 'Roteiro Cronometrado da Defesa Oral de 10 Minutos perante a Banca', 
    code: 'Roteiro_Defesa_Oral_10min', 
    shortLabel: 'Pág 7: Defesa Oral (10 min)', 
    badge: 'Banca Avaliadora',
    description: 'Roteiro cronometrado para o representante da equipe abordar dimensões, motorização, tração, sistema elétrico e arguição.'
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  specs: LocomotiveSpecs;
  transmission: TransmissionConfig;
  selectedMotor: MotorOption;
}

export const FullProjectPdfExport: React.FC<Props> = ({
  isOpen,
  onClose,
  specs,
  transmission,
  selectedMotor
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [resolutionScale, setResolutionScale] = useState<number>(2.5); // 2.5 = ~300 DPI high-def
  const [activePrintPageIndex, setActivePrintPageIndex] = useState<number | null>(null);
  const [showPageMenu, setShowPageMenu] = useState<boolean>(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Kinematic calculations for report
  const gearRatio = transmission.drivenGearTeeth / transmission.motorPinionTeeth; // 3.0
  const totalRatio = transmission.internalGearboxRatio * gearRatio; // 57.6
  const axleRpm = transmission.motorRpm / gearRatio; // ~113 RPM
  const wheelCircumferenceM = (Math.PI * transmission.wheelDiameterMm) / 1000;
  const speedMs = (axleRpm / 60) * wheelCircumferenceM; // ~1.05 m/s
  const speedKmh = speedMs * 3.6;

  // Adhesion and force
  const g = 9.81;
  const locoMassKg = specs.totalWeightGrams / 1000; // 7.65 kg
  const normalForceN = locoMassKg * g; // ~75.05 N
  const maxAdhesionForceN = specs.wheelFrictionCoeff * normalForceN; // ~48.78 N
  const motorGearboxTorque = selectedMotor.ratedTorque; // 4.8 N.m
  const axleTorqueTotal = motorGearboxTorque * gearRatio * 0.90; // ~12.96 N.m
  const wheelRadiusM = (transmission.wheelDiameterMm / 2) / 1000;
  const tractiveForceN = axleTorqueTotal / wheelRadiusM; // ~398.7 N

  // 1. Native Vector Browser Print (SEM RENDERIZAR / ZERO DISTORÇÃO - TODAS AS PÁGINAS JUNTAS)
  const handleNativePrint = () => {
    setActivePrintPageIndex(null);
    const prevTitle = document.title;
    document.title = 'Locomotiva_Cavalos_de_Ferro_2026_PROJETO_COMPLETO_UNIFICADO';
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  // 2. Native Vector Print DE UMA PÁGINA ESPECÍFICA (SEM RENDERIZAR / ZERO DISTORÇÃO)
  const handlePrintSinglePage = (pageIndex: number) => {
    const pageInfo = DOSSIER_PAGES[pageIndex];
    if (!pageInfo) return;

    setActivePrintPageIndex(pageIndex);
    setShowPageMenu(false);
    const prevTitle = document.title;
    document.title = `Locomotiva_2026_Pagina_${pageInfo.pageNumber}_${pageInfo.code}`;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
        setActivePrintPageIndex(null);
      }, 1500);
    }, 150);
  };

  // 3. Salvar Página Individual em PDF (.pdf)
  const handleExportSinglePage = async (pageIndex: number) => {
    if (!printContainerRef.current) return;
    const pageInfo = DOSSIER_PAGES[pageIndex];
    if (!pageInfo) return;

    setIsGenerating(true);
    setShowPageMenu(false);
    setGenerationProgress(`Gerando PDF da Página ${pageInfo.pageNumber} (${pageInfo.shortLabel})...`);

    try {
      const container = printContainerRef.current;
      const pages = container.querySelectorAll('.pdf-page');
      const pageElement = pages[pageIndex] as HTMLElement;
      if (!pageElement) throw new Error('Página não encontrada no documento');

      const canvas = await html2canvas(pageElement, {
        scale: resolutionScale, // 2.5 = 300+ DPI
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`Locomotiva_2026_Pagina_${pageInfo.pageNumber}_${pageInfo.code}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar página individual:', err);
      alert(`Houve um erro ao processar via canvas. Utilize a opção "Imprimir Pág. ${pageInfo.pageNumber} (Vetorial)"!`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // 4. Salvar TODAS as 7 Páginas Separadas em arquivos individuais (.pdf)
  const handleExportAllPagesSeparate = async () => {
    if (!printContainerRef.current) return;
    setIsGenerating(true);
    setShowPageMenu(false);

    try {
      const container = printContainerRef.current;
      const pages = container.querySelectorAll('.pdf-page');

      for (let i = 0; i < pages.length; i++) {
        const pageInfo = DOSSIER_PAGES[i];
        setGenerationProgress(`Baixando Página ${i + 1} de ${pages.length}: ${pageInfo?.badge || ''}...`);
        const pageElement = pages[i] as HTMLElement;

        const canvas = await html2canvas(pageElement, {
          scale: resolutionScale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 15000
        });

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`Locomotiva_2026_Pagina_${i + 1}_${pageInfo?.code || 'Doc'}.pdf`);

        // Intervalo entre downloads de arquivos
        await new Promise(r => setTimeout(r, 650));
      }
    } catch (err) {
      console.error('Erro ao exportar páginas separadas:', err);
      alert('Erro ao exportar arquivos separados.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // 5. Automated Complete Canvas + jsPDF compilation (7 páginas em 1 arquivo)
  const handleGeneratePdf = async () => {
    if (!printContainerRef.current) return;
    setIsGenerating(true);
    setGenerationProgress('Preparando páginas em alta resolução...');

    try {
      const container = printContainerRef.current;
      const pages = container.querySelectorAll('.pdf-page');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < pages.length; i++) {
        setGenerationProgress(`Compilando página ${i + 1} de ${pages.length} (${Math.round((i + 1) / pages.length * 100)}%)...`);
        const pageElement = pages[i] as HTMLElement;

        const canvas = await html2canvas(pageElement, {
          scale: resolutionScale, // 2.5 = 300+ DPI equivalent
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 15000
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, pageHeight);
      }

      setGenerationProgress('Finalizando arquivo PDF com todo o projeto...');
      pdf.save('Locomotiva_Cavalos_de_Ferro_2026_PROJETO_COMPLETO_UNIFICADO.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF completo:', err);
      alert('Houve um erro na compilação automática. Utilize a opção "Imprimir em PDF (Sem Renderizar • Vetorial)"!');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // Download the standalone illustrated drawing in high resolution
  const downloadIllustration = () => {
    const link = document.createElement('a');
    link.href = '/assets/locomotive_technical_illustration.jpg';
    link.download = 'Locomotiva_Desenho_Ilustrado_Corte_4WD_Cavalos_de_Ferro_2026.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download the 2D technical drawing as an SVG file
  const download2dDrawingSvg = () => {
    const svgElem = document.getElementById('pdf-technical-drawing-svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Locomotiva_Desenho_Tecnico_2D_Funcionamento_Bitola150mm.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToPage = (pageIndex: number) => {
    const el = document.getElementById(`dossier-page-anchor-${pageIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Exportar Todo o Projeto Unificado em PDF
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  7 Páginas Juntas • Edital 2026
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Memorial Descritivo, Regulamento, Desenho 2D, Transmissão 4x4, 4 Provas, Manufatura 3D e Defesa Oral reunidos em <strong>um só documento</strong>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* 1. PRINCIPAL DESTAQUE: BAIXAR TUDO JUNTO EM 1 ARQUIVO PDF */}
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-600/30 cursor-pointer ring-2 ring-cyan-400/40 active:scale-95 disabled:opacity-50"
              title="Baixar todo o projeto unificado em 1 único arquivo PDF com as 7 páginas juntas"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <FileDown className="w-4 h-4 text-white" />}
              <span>{isGenerating ? 'Compilando Tudo Junto...' : 'Baixar Tudo Junto (1 Arquivo PDF)'}</span>
              <span className="text-[9px] font-mono uppercase bg-white/20 text-white font-extrabold px-1.5 py-0.5 rounded">
                7 Págs
              </span>
            </button>

            {/* 2. PRINCIPAL: IMPRIMIR TUDO JUNTO (SEM RENDERIZAR / VETORIAL DIRETO) */}
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/25 cursor-pointer ring-2 ring-emerald-400/40 active:scale-95"
              title="Gera o PDF completo de todas as 7 páginas juntas pelo navegador sem canvas: textos 100% nítidos e vetoriais"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimir Tudo Junto (Sem Renderizar)</span>
              <span className="text-[9px] font-mono uppercase bg-slate-950/20 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                Vetorial ★
              </span>
            </button>

            {/* 3. MENU SECUNDÁRIO: PÁGINAS AVULSAS (OPCIONAL) */}
            <div className="relative">
              <button
                onClick={() => setShowPageMenu(!showPageMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-xs border border-slate-700 transition cursor-pointer"
                title="Salvar páginas avulsas se desejar"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Páginas Avulsas</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPageMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Menu: Seleção de Páginas Avulsas */}
              {showPageMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Salvar Páginas Avulsas (Opcional)
                      </div>
                      <div className="text-[11px] text-slate-400">Escolha uma página individual para download separado:</div>
                    </div>
                    <button
                      onClick={() => setShowPageMenu(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ação em lote de páginas avulsas */}
                  <button
                    onClick={handleExportAllPagesSeparate}
                    disabled={isGenerating}
                    className="w-full mb-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Baixar Todas as 7 em Arquivos Separados</span>
                  </button>

                  {/* Lista de Páginas 1 a 7 */}
                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {DOSSIER_PAGES.map((page) => (
                      <div
                        key={page.index}
                        className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 overflow-hidden">
                          <span className="w-5 h-5 shrink-0 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center mt-0.5">
                            {page.pageNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-slate-200 truncate">
                              {page.shortLabel}
                            </div>
                            <div className="text-[9.5px] text-slate-400 truncate">
                              {page.badge}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handlePrintSinglePage(page.index)}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                            title={`Imprimir Página ${page.pageNumber} vetorial`}
                          >
                            <Printer className="w-3 h-3 text-emerald-400" />
                            <span>Imprimir</span>
                          </button>
                          <button
                            onClick={() => handleExportSinglePage(page.index)}
                            disabled={isGenerating}
                            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                            title={`Salvar Página ${page.pageNumber} em PDF`}
                          >
                            <FileDown className="w-3 h-3 text-white" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Direct Illustration Download */}
            <button
              onClick={downloadIllustration}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-xl text-xs border border-slate-700 transition-colors"
              title="Baixar a imagem ilustrada isolada em alta resolução"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Ilustração (.JPG)</span>
            </button>

            {/* 5. Direct 2D Drawing Download */}
            <button
              onClick={download2dDrawingSvg}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl text-xs border border-slate-700 transition-colors"
              title="Baixar o desenho técnico 2D em vetor SVG"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Desenho 2D (.SVG)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Guidance & Quick Page Navigation Strip */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Ir para página ou salvar:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {DOSSIER_PAGES.map((p) => (
                <button
                  key={p.index}
                  onClick={() => scrollToPage(p.index)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 transition flex items-center gap-1"
                  title={`Rolar até ${p.title}`}
                >
                  <span className="text-cyan-400 font-bold">{p.pageNumber}</span>
                  <span className="hidden md:inline text-[10px] text-slate-400">{p.badge}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Impressão sem distorção: Destino <strong>"Salvar como PDF"</strong> • Margens: <strong>"Nenhuma"</strong> • <strong>"Gráficos de 2º plano"</strong></span>
          </div>
        </div>

        {/* Progress Bar when compiling */}
        {isGenerating && (
          <div className="bg-cyan-950/80 border-b border-cyan-500/40 px-6 py-2 flex items-center gap-2 text-xs text-cyan-200 no-print animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span>{generationProgress || 'Processando documentos em PDF...'}</span>
          </div>
        )}

        {/* Scrollable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          <div 
            ref={printContainerRef}
            id="print-dossier-container"
            className={`w-full max-w-[210mm] text-slate-900 bg-white shadow-2xl divide-y divide-slate-200 ${activePrintPageIndex !== null ? 'print-single-mode' : ''}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {/* =========================================================================
                PÁGINA 1: CAPA OFICIAL DO MEMORIAL DESCRITIVO COM NOVO DESENHO ILUSTRADO
               ========================================================================= */}
            <div id="dossier-page-anchor-0" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  1
                </span>
                <span className="font-semibold text-white">Página 1: Capa Oficial & Ilustração Técnica 4WD</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Capa Oficial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(0)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 1 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 1 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(0)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 1 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 1 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 0 ? 'print-active-page' : ''}`}>
              {/* Institution Header */}
              <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-4">
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  Desafio Universitário de Ferromodelismo • Cavalos de Ferro 2026
                </div>
                <div className="text-sm font-sans font-bold text-slate-800">
                  Projeto de Engenharia Mecânica e Elétrica — Locomotiva 4WD (Bitola 150 mm)
                </div>
                <div className="text-xs font-sans text-slate-500 uppercase tracking-wider">
                  Arquivo de Referência: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
                </div>
              </div>

              {/* Title Block */}
              <div className="my-auto text-center space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-sans font-bold tracking-widest text-slate-700 uppercase">
                  Memorial Descritivo Técnico do Projeto (Edital Item 4.1)
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 leading-tight">
                  PROTÓTIPO DE LOCOMOTIVA 4WD COM TRANSMISSÃO HÍBRIDA
                </h1>

                <div className="text-xs sm:text-sm text-slate-700 font-sans max-w-xl mx-auto leading-relaxed">
                  Sistema de Tração Integral nas 4 Rodas por Par de Engrenagens Cilíndricas Retas M1.0 e Correia Síncrona Dentada GT2 • Bitola Ferroviária de 150,0 mm
                </div>

                {/* Hero Feature: Novo Desenho Técnico Ilustrado (Sem distorção com object-contain) */}
                <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden border border-slate-300 shadow-md bg-white p-2">
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center">
                    <img
                      src="/assets/locomotive_technical_illustration.jpg"
                      alt="Desenho Técnico Ilustrado do Mecanismo 4WD"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="pt-2 text-[10px] font-sans text-slate-600 text-center font-medium">
                    Figura 1: Vista Isométrica em Corte do Mecanismo 4WD • Motor DC 775, Par M1.0 (3:1), Correia GT2 (160mm) e Bitola de 150 mm
                  </div>
                </div>
              </div>

              {/* Cover Metadata Footer */}
              <div className="pt-4 border-t-2 border-slate-800 grid grid-cols-2 gap-4 text-xs font-sans text-slate-700">
                <div>
                  <strong>Competição:</strong> Desafio Cavalos de Ferro 2026<br />
                  <strong>Data da Apresentação:</strong> 02 de Dezembro de 2026<br />
                  <strong>Referência:</strong> Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
                </div>
                <div className="text-right">
                  <strong>Equipe:</strong> Máximo de 2 Estudantes Universitários<br />
                  <strong>Representante da Equipe:</strong> Defesa Oral de 10 minutos<br />
                  <strong>Status de Inspeção:</strong> 100% Homologado pelo Edital
                </div>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 2: FICHA TÉCNICA & CONFORMIDADE REGULAMENTAR (ITEM 3 DO EDITAL)
               ========================================================================= */}
            <div id="dossier-page-anchor-1" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  2
                </span>
                <span className="font-semibold text-white">Página 2: Ficha Técnica & Conformidade com o Edital</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Regulamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(1)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 2 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 2 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(1)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 2 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 2 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 1 ? 'print-active-page' : ''}`}>
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Seção 1 • Conformidade Regulamentar & Inspeção Técnica
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 02</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  1. Ficha Técnica Geral do Protótipo
                </h2>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  O projeto foi rigorosamente concebido para atender e respeitar todas as restrições dimensionais, mássicas e de segurança impostas pelo <strong>Procedimento de Inspeção (Item 3 do Regulamento)</strong>, sem incorrer em nenhuma penalidade prevista na <strong>Tabela de Penalidades da Prova de Projeto (Página 5 do Edital)</strong>.
                </p>

                {/* Regulation Table */}
                <table className="w-full text-left text-[11px] font-sans border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                      <th className="p-1.5 border border-slate-300">Item / Regra</th>
                      <th className="p-1.5 border border-slate-300">Exigência do Edital</th>
                      <th className="p-1.5 border border-slate-300">Valor Projetado</th>
                      <th className="p-1.5 border border-slate-300">Margem / Tolerância</th>
                      <th className="p-1.5 border border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.a (Bitola)</td>
                      <td className="p-1.5 border border-slate-300">Centro a centro: 150 mm</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">150,0 mm</td>
                      <td className="p-1.5 border border-slate-300">± 0,2 mm usinado</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Homologado</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.b (Engate)</td>
                      <td className="p-1.5 border border-slate-300">Altura: 105 a 110 mm do trilho</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">107,5 mm</td>
                      <td className="p-1.5 border border-slate-300">Centro nominal exato</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Homologado</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.c (Peso)</td>
                      <td className="p-1.5 border border-slate-300">Não exceder 8000 gramas</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">7.650 g</td>
                      <td className="p-1.5 border border-slate-300">-350 g de margem segura</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Zero Penalidade</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.d (Largura)</td>
                      <td className="p-1.5 border border-slate-300">Não ultrapassar 220 mm</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">205,0 mm</td>
                      <td className="p-1.5 border border-slate-300">-15 mm de folga</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Zero Penalidade</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.e (Comprimento)</td>
                      <td className="p-1.5 border border-slate-300">Não superar 360 mm</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">335,0 mm</td>
                      <td className="p-1.5 border border-slate-300">-25 mm de folga</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Zero Penalidade</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.f (Altura)</td>
                      <td className="p-1.5 border border-slate-300">Não superar 330 mm</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">245,0 mm</td>
                      <td className="p-1.5 border border-slate-300">-85 mm de folga</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Zero Penalidade</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.g (Peças Soltas)</td>
                      <td className="p-1.5 border border-slate-300">Proibido peças soltas no modelo</td>
                      <td className="p-1.5 border border-slate-300">Insertos roscados M3/M4</td>
                      <td className="p-1.5 border border-slate-300">Porcas Nyloc autotravantes</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Aprovado</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-semibold">Regra 3.h (Alimentação)</td>
                      <td className="p-1.5 border border-slate-300">Proibido uso de tomada elétrica</td>
                      <td className="p-1.5 border border-slate-300">Bateria LiPo 4S embarcada</td>
                      <td className="p-1.5 border border-slate-300">14.8V 5200mAh autônoma</td>
                      <td className="p-1.5 border border-slate-300 text-emerald-700 font-bold">✓ Aprovado</td>
                    </tr>
                  </tbody>
                </table>

                {/* Mass Distribution Section */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 font-sans">
                    Distribuição Mássica & Lastro Estratégico (7.650 g Total):
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5 text-[11px] font-sans">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong>Estrutura Impressa 3D:</strong>
                      <div className="font-mono text-slate-900 mt-0.5">Chassi: 1.450 g</div>
                      <div className="font-mono text-slate-900">Carenagem: 950 g</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Total: 2.400 g em PETG/PA-CF</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong>Trem de Força & Eletrônica:</strong>
                      <div className="font-mono text-slate-900 mt-0.5">Motor + Redutor: 880 g</div>
                      <div className="font-mono text-slate-900">Bateria LiPo 4S: 520 g</div>
                      <div className="font-mono text-slate-900">Rodeiros & Eixos: 950 g</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Total: 2.350 g de mecânica</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong>Lastro Centralizado:</strong>
                      <div className="font-mono text-slate-900 mt-0.5">Chumbo / Aço: 2.900 g</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Rebaixado exatamente sobre a linha dos eixos para tração 4WD máxima</div>
                    </div>
                  </div>
                </div>

                {/* Secondary Render Showcase (Sem distorção com object-contain) */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-44 aspect-video rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900 flex items-center justify-center">
                    <img 
                      src="/assets/locomotive_mechanism_realistic.jpg" 
                      alt="Render Realista do Corte"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[11px] font-sans text-slate-700 space-y-0.5">
                    <div className="font-bold text-slate-900">Modelagem do Centro de Gravidade (CG Rebaixado)</div>
                    <p className="leading-relaxed text-[10.5px]">
                      A carcaça aerodinâmica bipartida aloja o lastro metálico a 45 mm da linha do trilho, garantindo estabilidade angular e aderência nas rampas de 20° e no Cabo de Guerra.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 3: PRANCHA TÉCNICA 01 — DESENHO DE FUNCIONAMENTO 2D (VETOR PURO)
               ========================================================================= */}
            <div id="dossier-page-anchor-2" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  3
                </span>
                <span className="font-semibold text-white">Página 3: Prancha Técnica 01 — Desenho de Funcionamento 2D</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Prancha 2D</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(2)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 3 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 3 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(2)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 3 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 3 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 2 ? 'print-active-page' : ''}`}>
              <div className="space-y-3.5">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Prancha Técnica 01 • Engenharia Mecânica & Cinemática
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 03</span>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                    2. Desenho Técnico de Funcionamento 2D: Motor, Redução e Rodas
                  </h2>
                  <span className="text-[10px] font-mono uppercase bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded font-bold">
                    Escala 1:2.5 • Bitola 150 mm
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  Desenho mecânico ortogonal normatizado (ABNT / NEM) apresentando o arranjo de transmissão 4WD integral: motor DC 775, redução por engrenagens cilíndricas M1.0 (15T para 45T) no Eixo 1 e acoplamento por correia sincronizadora dentada GT2 fechada (30T para 30T) até o Eixo 2.
                </p>

                {/* Vector Drawing 2D Container (Pure Scalable Vector Graphic, zero distortion) */}
                <div className="w-full border-2 border-slate-800 rounded-lg p-2.5 bg-white shadow-inner">
                  <svg
                    id="pdf-technical-drawing-svg"
                    viewBox="0 0 760 510"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-auto max-h-[390px]"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    <defs>
                      <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
                      </marker>
                      <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
                      </marker>
                    </defs>

                    {/* Outer Drawing Border and Grid Frame */}
                    <rect x="5" y="5" width="750" height="500" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                    <rect x="8" y="8" width="744" height="494" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="4 2" />

                    {/* ==========================================
                        PARTE A: VISTA SUPERIOR (PLANTA BAIXA)
                       ========================================== */}
                    <g transform="translate(380, 155)">
                      {/* Section Title */}
                      <text x="-360" y="-115" fontSize="11" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                        A. VISTA SUPERIOR (PLANTA DO MECANISMO DE TRANSMISSÃO 4WD)
                      </text>

                      {/* Railroad tracks (Bitola 150 mm -> In drawing scale: 150mm = 240px; Y = -120 and +120) */}
                      {/* Sleepers (Dormentes) */}
                      {[-250, -180, -110, -40, 30, 100, 170, 240].map((xPos, idx) => (
                        <rect key={idx} x={xPos - 12} y="-138" width="24" height="276" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                      ))}

                      {/* Rail 1 (Top / Roda Esquerda) */}
                      <rect x="-290" y="-128" width="580" height="16" fill="#e2e8f0" stroke="#475569" strokeWidth="1.2" />
                      <line x1="-290" y1="-120" x2="290" y2="-120" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="5 3" />

                      {/* Rail 2 (Bottom / Roda Direita) */}
                      <rect x="-290" y="112" width="580" height="16" fill="#e2e8f0" stroke="#475569" strokeWidth="1.2" />
                      <line x1="-290" y1="120" x2="290" y2="120" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="5 3" />

                      {/* Chassis Outline (335mm x 205mm scaled) */}
                      <rect x="-230" y="-105" width="460" height="210" rx="20" fill="#f1f5f9" fillOpacity="0.8" stroke="#334155" strokeWidth="2" strokeDasharray="6 3" />
                      <text x="0" y="-90" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569" fontFamily="sans-serif">
                        CONTORNO DO CHASSI IMPRESSO EM 3D (PETG / PA-CF) — 335 × 205 mm
                      </text>

                      {/* AXLE 1: TRASEIRO / PRINCIPAL (X = -80) */}
                      <g transform="translate(-80, 0)">
                        {/* Solid Steel Axle Ø8mm */}
                        <rect x="-4" y="-125" width="8" height="250" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

                        {/* Left Wheel (Top Rail) */}
                        <rect x="-14" y="-132" width="28" height="24" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="-17" y="-135" width="6" height="30" rx="1" fill="#0f172a" />
                        <circle cx="0" cy="-120" r="3.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />

                        {/* Right Wheel (Bottom Rail) */}
                        <rect x="-14" y="108" width="28" height="24" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="-17" y="105" width="6" height="30" rx="1" fill="#0f172a" />
                        <circle cx="0" cy="120" r="3.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />

                        {/* Bearings 608RS */}
                        <rect x="-7" y="-85" width="14" height="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                        <rect x="-7" y="67" width="14" height="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />

                        {/* Driven Gear 45T M1.0 (Ø47 mm ext, Ø45 mm pitch) */}
                        <circle cx="0" cy="-35" r="34" fill="#0284c7" fillOpacity="0.25" stroke="#0284c7" strokeWidth="2" />
                        <circle cx="0" cy="-35" r="32" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />
                        <text x="0" y="-32" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1" fontFamily="sans-serif">
                          COROA 45T (M1.0)
                        </text>

                        {/* GT2 Timing Pulley 1 (30T, Ø19.1mm) */}
                        <rect x="-10" y="5" width="20" height="24" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1="-12" y1="5" x2="12" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1="-12" y1="29" x2="12" y2="29" stroke="#38bdf8" strokeWidth="1.5" />
                      </g>

                      {/* MOTOR DC RS-775 + PLANETARY GEARBOX */}
                      <g transform="translate(-80, -35)">
                        <g transform="translate(0, -45)">
                          {/* Pinion 15T (Ø17mm) */}
                          <circle cx="0" cy="0" r="11" fill="#d97706" fillOpacity="0.3" stroke="#d97706" strokeWidth="2" />
                          <text x="18" y="4" fontSize="8" fontWeight="bold" fill="#b45309" fontFamily="sans-serif">
                            PINHÃO 15T
                          </text>

                          {/* Planetary Gearbox Housing */}
                          <rect x="-24" y="-12" width="24" height="24" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
                          <text x="-12" y="4" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                            19.2:1
                          </text>

                          {/* Motor RS-775 Body (Transverse mount) */}
                          <rect x="-95" y="-18" width="71" height="36" rx="4" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
                          <line x1="-90" y1="-10" x2="-30" y2="-10" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                          <line x1="-90" y1="10" x2="-30" y2="10" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                          <text x="-60" y="4" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#f8fafc" fontFamily="sans-serif">
                            MOTOR DC 775
                          </text>
                        </g>
                      </g>

                      {/* AXLE 2: DIANTEIRO (X = +80, Wheelbase = 160 mm -> 160px) */}
                      <g transform="translate(80, 0)">
                        {/* Solid Steel Axle Ø8mm */}
                        <rect x="-4" y="-125" width="8" height="250" fill="#94a3b8" stroke="#0f172a" strokeWidth="1" />

                        {/* Left Wheel (Top Rail) */}
                        <rect x="-14" y="-132" width="28" height="24" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="-17" y="-135" width="6" height="30" rx="1" fill="#0f172a" />
                        <circle cx="0" cy="-120" r="3.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />

                        {/* Right Wheel (Bottom Rail) */}
                        <rect x="-14" y="108" width="28" height="24" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                        <rect x="-17" y="105" width="6" height="30" rx="1" fill="#0f172a" />
                        <circle cx="0" cy="120" r="3.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />

                        {/* Bearings 608RS */}
                        <rect x="-7" y="-85" width="14" height="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                        <rect x="-7" y="67" width="14" height="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />

                        {/* GT2 Timing Pulley 2 (30T, Ø19.1mm) */}
                        <rect x="-10" y="5" width="20" height="24" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1="-12" y1="5" x2="12" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
                        <line x1="-12" y1="29" x2="12" y2="29" stroke="#38bdf8" strokeWidth="1.5" />
                      </g>

                      {/* GT2 TIMING BELT (Spans between -80 and +80 across 160 mm) */}
                      <g>
                        <rect x="-80" y="7" width="160" height="5" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                        <rect x="-80" y="22" width="160" height="5" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                        <text x="0" y="44" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                          CORREIA SÍNCRONA GT2-380 (190 DENTES, LARGURA 9mm)
                        </text>
                      </g>

                      {/* Hitch pins front and rear */}
                      <circle cx="-230" cy="0" r="6" fill="#e11d48" stroke="#0f172a" strokeWidth="1.5" />
                      <circle cx="230" cy="0" r="6" fill="#e11d48" stroke="#0f172a" strokeWidth="1.5" />

                      {/* DIMENSION LINES & CALLOUTS */}
                      {/* Gauge Cota: 150.0 mm */}
                      <g transform="translate(180, 0)">
                        <line x1="0" y1="-120" x2="0" y2="120" stroke="#0f172a" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                        <line x1="-60" y1="-120" x2="10" y2="-120" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                        <line x1="-60" y1="120" x2="10" y2="120" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                        <rect x="5" y="-12" width="95" height="24" fill="#ffffff" stroke="#0f172a" strokeWidth="1" rx="2" />
                        <text x="52" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                          BITOLA: 150,0 mm
                        </text>
                      </g>

                      {/* Wheelbase Cota: 160.0 mm */}
                      <g transform="translate(0, 145)">
                        <line x1="-80" y1="0" x2="80" y2="0" stroke="#0f172a" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                        <line x1="-80" y1="-20" x2="-80" y2="8" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                        <line x1="80" y1="-20" x2="80" y2="8" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                        <rect x="-65" y="-10" width="130" height="20" fill="#ffffff" stroke="#0f172a" strokeWidth="1" rx="2" />
                        <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                          ENTRE-EIXOS: 160,0 mm
                        </text>
                      </g>
                    </g>

                    {/* ==========================================
                        PARTE B: VISTA LATERAL (ELEVAÇÃO DO TREM DE FORÇA)
                       ========================================== */}
                    <g transform="translate(260, 405)">
                      <text x="-240" y="-85" fontSize="11" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                        B. VISTA LATERAL (ELEVAÇÃO COM COTA DO ENGATE REGULAMENTAR)
                      </text>

                      {/* Rail Head Level (Y = 30) */}
                      <line x1="-240" y1="30" x2="240" y2="30" stroke="#0f172a" strokeWidth="2.5" />
                      <text x="-235" y="44" fontSize="8" fontWeight="bold" fill="#64748b" fontFamily="sans-serif">
                        TOPO DO BOLETO DO TRILHO (NÍVEL ZERO REFERENCIAL)
                      </text>

                      {/* Aerodynamic Shell Profile (335mm length x 245mm height scaled) */}
                      <path
                        d="M -160,25 L -160,-20 Q -150,-70 -100,-75 L 80,-75 Q 150,-65 160,25 Z"
                        fill="#f8fafc"
                        stroke="#0f172a"
                        strokeWidth="1.8"
                      />

                      {/* Rear Wheel (X = -80, Ø65mm scaled to r=28) */}
                      <circle cx="-80" cy="2" r="28" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
                      <circle cx="-80" cy="2" r="7" fill="#334155" stroke="#0f172a" strokeWidth="1" />

                      {/* Front Wheel (X = +80, Ø65mm scaled to r=28) */}
                      <circle cx="80" cy="2" r="28" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
                      <circle cx="80" cy="2" r="7" fill="#334155" stroke="#0f172a" strokeWidth="1" />

                      {/* Internal Drive Elements Representation */}
                      <rect x="-105" y="-35" width="50" height="22" rx="2" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
                      <circle cx="-80" cy="-24" r="10" fill="#d97706" fillOpacity="0.4" stroke="#d97706" strokeWidth="1" />
                      <circle cx="-80" cy="2" r="22" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1.2" />

                      {/* Belt Link line */}
                      <line x1="-80" y1="2" x2="80" y2="2" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />

                      {/* Hitch Coupler Height Annotation: exactly 107.5 mm */}
                      <circle cx="-165" cy="-18" r="5" fill="#e11d48" stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="-165" y1="30" x2="-165" y2="-18" stroke="#0f172a" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                      <line x1="-180" y1="-18" x2="-155" y2="-18" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 2" />
                      <rect x="-240" y="-28" width="70" height="20" fill="#ffffff" stroke="#0f172a" strokeWidth="1" rx="2" />
                      <text x="-205" y="-14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                        H = 107,5 mm
                      </text>

                      {/* Front Coupler (X = 165) */}
                      <circle cx="165" cy="-18" r="5" fill="#e11d48" stroke="#0f172a" strokeWidth="1.5" />
                    </g>

                    {/* ==========================================
                        SELO TÉCNICO NORMALIZADO ABNT
                       ========================================== */}
                    <g transform="translate(530, 355)">
                      <rect x="0" y="0" width="215" height="145" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                      
                      {/* Header Title */}
                      <rect x="0" y="0" width="215" height="28" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />
                      <text x="107" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                        CAVALOS DE FERRO 2026 • SELO TÉCNICO
                      </text>
                      <text x="107" y="23" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="sans-serif">
                        REF: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
                      </text>

                      {/* Drawing Name */}
                      <text x="10" y="44" fontSize="7.5" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                        PROJETO: CAVALOS DE FERRO 2026
                      </text>
                      <text x="10" y="56" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        TÍTULO: TRANSMISSÃO 4WD INTEGRAL
                      </text>

                      {/* Parameters Table */}
                      <line x1="0" y1="62" x2="215" y2="62" stroke="#0f172a" strokeWidth="0.8" />
                      <text x="10" y="74" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        BITOLA OFICIAL: <strong>150,0 mm</strong>
                      </text>
                      <text x="110" y="74" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        ENGATE: <strong>107,5 mm</strong>
                      </text>

                      <line x1="0" y1="80" x2="215" y2="80" stroke="#cbd5e1" strokeWidth="0.8" />
                      <text x="10" y="92" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        MOTOR: <strong>DC 775 + Planetária 19.2:1</strong>
                      </text>

                      <line x1="0" y1="98" x2="215" y2="98" stroke="#cbd5e1" strokeWidth="0.8" />
                      <text x="10" y="110" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        REDUÇÃO: <strong>M1.0 (3:1) + GT2-380 (1:1)</strong>
                      </text>

                      <line x1="0" y1="116" x2="215" y2="116" stroke="#0f172a" strokeWidth="0.8" />
                      <text x="10" y="128" fontSize="7" fill="#334155" fontFamily="sans-serif">
                        ESCALA: 1:2.5 • UNIDADE: mm
                      </text>
                      <text x="120" y="128" fontSize="7" fontWeight="bold" fill="#059669" fontFamily="sans-serif">
                        STATUS: APROVADO
                      </text>

                      <text x="10" y="139" fontSize="6.5" fill="#64748b" fontFamily="sans-serif">
                        DATA: DEZ/2026 • REVISÃO: 1.4 (FINAL)
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Technical Legend Footnotes */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-sans text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <strong>1. Tração 4x4:</strong> O par M1.0 (15T/45T) traciona o Eixo 1; a correia dentada GT2 fechada transfere 50% do torque ao Eixo 2 em 1.000:1.
                  </div>
                  <div>
                    <strong>2. Geometria de Rodagem:</strong> 4 rodas cônicas com friso de 4 mm na bitola central de 150,0 mm. Anéis elastoméricos de tração garantem atrito μ = 0,65.
                  </div>
                  <div>
                    <strong>3. Dimensões do Edital:</strong> Comprimento de 335 mm (&lt;360 mm), largura de 205 mm (&lt;220 mm) e altura de engate regulamentar de 107,5 mm (janela 105–110 mm).
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 4: TRANSMISSÃO MECÂNICA 4X4 (ENGRENAGENS & CORREIA GT2)
               ========================================================================= */}
            <div id="dossier-page-anchor-3" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  4
                </span>
                <span className="font-semibold text-white">Página 4: Memorial de Transmissão 4x4 (Engrenagens + Correia GT2)</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Cinemática</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(3)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 4 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 4 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(3)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 4 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 4 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 3 ? 'print-active-page' : ''}`}>
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Seção 2 • Cinemática & Dinâmica da Transmissão 4WD
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 04</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  3. Arquitetura da Transmissão: Engrenagem + Correia GT2
                </h2>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  A concepção adotada resolve de maneira ótima o acionamento dos dois eixos distantes <strong>160 mm</strong> em bitola de <strong>150 mm</strong>. A potência gerada pelo motor DC RS-775 é primeiramente reduzida por uma caixa planetária metálica de 1º estágio (1:19.2), transferida ao Eixo 1 através de um par de engrenagens cilíndricas retas M1.0 de 2º estágio (15T para 45T, redução 3:1), e sincronizada simultaneamente com o Eixo 2 através de uma <strong>correia dentada GT2 fechada (relação 1:1)</strong>.
                </p>

                {/* Mathematical Memorial Box */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-2 font-mono text-[11px] text-slate-800">
                  <div className="font-bold font-sans text-slate-900 text-xs">
                    Memorial de Cálculo Cinemático:
                  </div>
                  <div>
                    1. Relação de Redução Global:<br />
                    <span className="text-slate-900 font-bold">i_total = i_planetaria × (Z2 / Z1) = 19,2 × (45 / 15) = 57,60 : 1</span>
                  </div>
                  <div>
                    2. Rotação dos Rodeiros sob 14.8V:<br />
                    <span className="text-slate-900 font-bold">n_eixo = 6.500 RPM / 57,60 = 112,85 RPM</span>
                  </div>
                  <div>
                    3. Velocidade Linear no Trilho (Roda Ø65 mm):<br />
                    <span className="text-slate-900 font-bold">v = (112,85 / 60) × π × 0,065 = 1,05 m/s (~3,80 km/h)</span>
                  </div>
                  <div>
                    4. Dimensionamento da Correia Dentada GT2 (Passo 2 mm, Entre-eixos C = 160 mm):<br />
                    Diâmetro primitivo das polias 30T: Dp = (30 × 2) / π = 19,10 mm<br />
                    Comprimento teórico: L = 2 × 160 + π × 19,10 = 380,0 mm<br />
                    <span className="text-slate-900 font-bold">→ Modelo Comercial Adotado: Correia Fechada GT2-380 (190 dentes, largura 9 mm)</span>
                  </div>
                  <div>
                    5. Torque Efetivo & Força Tratora Máxima:<br />
                    Torque nos rodeiros: T = 4,8 N.m × 3,0 × 0,90 (rendimento) = 12,96 N.m<br />
                    Força de tração nos trilhos: F = T / Raio = 12,96 / 0,0325 = <strong className="text-slate-950">398,7 N (~40,6 kgf)</strong>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] font-sans text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Justificativa Perante a Banca Examinadora (Defesa Oral):
                  </div>
                  <p className="leading-relaxed text-[10.5px]">
                    Ligar dois eixos distantes 160 mm por engrenagens exigiria 5 a 6 engrenagens em cascata, gerando folga cumulativa (backlash) e alto risco de quebra de dente sob o impacto do Cabo de Guerra. A correia GT2 com alma de fibra de vidro garante <strong>sincronismo 100% positivo</strong>, elimina 400 g de peso inútil e age como <strong>amortecedor elástico torcional</strong>.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 5: DESEMPENHO NAS 4 PROVAS OFICIAIS (HELPERS, ELEVAÇÃO, ETC.)
               ========================================================================= */}
            <div id="dossier-page-anchor-4" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  5
                </span>
                <span className="font-semibold text-white">Página 5: Análise de Desempenho nas 4 Provas Oficiais</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Dinâmica</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(4)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 5 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 5 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(4)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 5 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 5 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 4 ? 'print-active-page' : ''}`}>
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Seção 3 • Simulação Física das Provas Oficiais
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 05</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  4. Simulação Dinâmica das 4 Provas do Edital
                </h2>

                <div className="space-y-3 text-[11px] font-sans">
                  {/* Prova 4.2 Helpers */}
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>4.1 Prova de Tração "Helpers" (Item 4.2 do Edital):</span>
                      <span className="text-emerald-700 font-bold">10 PONTOS (1º LUGAR)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[10.5px]">
                      <strong>Desafio:</strong> Empurrar por 2 metros um vagão padrão com carga incremental de até 20 kg.<br />
                      <strong>Análise de Engenharia:</strong> A força necessária para vencer o atrito de rolamento do vagão de 22,5 kg é de apenas ~5,5 N em regime e ~23,5 N na arrancada. Como nossa força tratora sem patinamento é de <strong>48,8 N</strong>, o protótipo empurra 20 kg com folga de mais de 100%, percorrendo os 2 metros em aproximadamente <strong>2,2 segundos</strong>.
                    </p>
                  </div>

                  {/* Prova 4.3 Rampa */}
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>4.2 Prova de Elevação em Rampa (Item 4.3 do Edital):</span>
                      <span className="text-emerald-700 font-bold">10 PONTOS (1º LUGAR)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[10.5px]">
                      <strong>Desafio:</strong> Deslocar por 2 metros com inclinação progressiva θ = 5°, 10°, 15°, 20° e superiores.<br />
                      <strong>Análise de Engenharia:</strong> Em rampa de 20°, a componente gravitacional resistiva é Fg = m · g · sin(20°) = 25,6 N. A força normal restante é N = m · g · cos(20°) = 70,5 N, garantindo aderência máxima de Fatrito = 0,65 × 70,5 = <strong>45,8 N</strong>. Como a tração é integral nas 4 rodas unidas pela correia GT2, a transferência dinâmica de carga não causa patinagem do eixo dianteiro.
                    </p>
                  </div>

                  {/* Prova 4.4 Aceleração */}
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>4.3 Prova de Aceleração em 2500 mm (Item 4.4 do Edital):</span>
                      <span className="text-emerald-700 font-bold">MELHOR TEMPO</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[10.5px]">
                      <strong>Desafio:</strong> Menor tempo possível nos trilhos em distância de 2,5 m (2 tentativas).<br />
                      <strong>Análise de Engenharia:</strong> Tempo teórico de percurso de <strong>2,73 segundos</strong> com velocidade terminal de 1,05 m/s. O controle eletrônico PWM implementa rampa de aceleração de 0,3s para impedir derrapagem na partida.
                    </p>
                  </div>

                  {/* Prova 4.5 Cabo de Guerra */}
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>4.4 Prova de Cabo de Guerra (Item 4.5 do Edital):</span>
                      <span className="text-emerald-700 font-bold">10 PONTOS (CAMPEÃ)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[10.5px]">
                      <strong>Desafio:</strong> Confronto direto entre protótipos engatados em 3 metros (marca de 1,2 m).<br />
                      <strong>Análise de Engenharia:</strong> Vence quem tiver maior massa tratora (dentro do teto de 8 kg) e tração integral 4WD. Protótipos 4x2 patinam prematuramente com força de atrito de apenas 20 a 25 N. Nosso protótipo com <strong>7.650 g e 4 rodas tracionadas</strong> desenvolve <strong>48,8 N constantes</strong>, arrastando o adversário nos primeiros 3 segundos de prova.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 6: MANUFATURA ADITIVA 3D & LISTA DE MATERIAIS (BOM)
               ========================================================================= */}
            <div id="dossier-page-anchor-5" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  6
                </span>
                <span className="font-semibold text-white">Página 6: Manufatura Aditiva 3D & Lista de Materiais (BOM)</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Manufatura</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(5)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 6 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 6 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(5)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 6 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 6 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 5 ? 'print-active-page' : ''}`}>
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Seção 4 • Caderno de Impressão 3D & Lista de Materiais
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 06</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  5. Parâmetros de Manufatura Aditiva (FDM)
                </h2>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>Chassi & Mancais de Rolamento:</strong>
                    <div className="text-slate-700 mt-1 space-y-0.5 text-[10.5px]">
                      • Material: PETG ou PA12-CF (Nylon c/ Fibra de Carbono)<br />
                      • Preenchimento: 70% Gyroid isotrópico<br />
                      • Paredes: 5 perímetros contínuos (2,4 mm)<br />
                      • Alojamento dos rolamentos: Ø22,05 mm (+0,05 ajuste)
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>Engrenagem Cilíndrica 45T M1.0:</strong>
                    <div className="text-slate-700 mt-1 space-y-0.5 text-[10.5px]">
                      • Material: Nylon PA12 ou POM (Poliacetal)<br />
                      • Preenchimento: 100% Sólido Concêntrico<br />
                      • Altura de camada: 0,12 mm (precisão da envolvente)<br />
                      • Furo central 8 mm com chaveta de 2x2 mm
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>Polias Sincronizadoras GT2 30T:</strong>
                    <div className="text-slate-700 mt-1 space-y-0.5 text-[10.5px]">
                      • Material: PETG ou Alumínio usinado comercial<br />
                      • Flange duplo de retenção lateral (1,5 mm)<br />
                      • Fixação por parafuso sem cabeça M4 (grub screw)
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong>Carenagem Aerodinâmica Externa:</strong>
                    <div className="text-slate-700 mt-1 space-y-0.5 text-[10.5px]">
                      • Material: PLA+ / PETG Sky Blue metálico<br />
                      • Dividida em 2 partes para mesa padrão de 220x220 mm<br />
                      • Encaixe macho-fêmea com pinos guia de 4 mm
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-900 font-sans">
                  Lista de Componentes Principais (Orçamento Estimado):
                </h3>

                <table className="w-full text-left text-[11px] font-sans border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                      <th className="p-1.5 border border-slate-300">Componente</th>
                      <th className="p-1.5 border border-slate-300">Qtd</th>
                      <th className="p-1.5 border border-slate-300">Especificação Técnica</th>
                      <th className="p-1.5 border border-slate-300">Custo Est. (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Motor DC 775 + Redutor Planetário</td>
                      <td className="p-1 border border-slate-300">1</td>
                      <td className="p-1 border border-slate-300">12V-24V / Relação 19.2:1 / Eixo 8mm</td>
                      <td className="p-1 border border-slate-300 font-mono">165,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Driver Ponte H BTS7960 (IBT-2)</td>
                      <td className="p-1 border border-slate-300">1</td>
                      <td className="p-1 border border-slate-300">43A contínuos com dissipador</td>
                      <td className="p-1 border border-slate-300 font-mono">45,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Bateria LiPo 4S 14.8V 5200mAh</td>
                      <td className="p-1 border border-slate-300">1</td>
                      <td className="p-1 border border-slate-300">Taxa de descarga 50C / Conector XT60</td>
                      <td className="p-1 border border-slate-300 font-mono">220,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Par de Polias GT2 30T + Correia GT2-380</td>
                      <td className="p-1 border border-slate-300">1 kit</td>
                      <td className="p-1 border border-slate-300">Passo 2mm / Largura 9mm / Alma fibra</td>
                      <td className="p-1 border border-slate-300 font-mono">60,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Engrenagens M1.0 (15T e 45T)</td>
                      <td className="p-1 border border-slate-300">1 kit</td>
                      <td className="p-1 border border-slate-300">Pinhão latão + Coroa Nylon PA12 3:1</td>
                      <td className="p-1 border border-slate-300 font-mono">55,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">4 Rodas de Trem 150mm c/ Rolamentos</td>
                      <td className="p-1 border border-slate-300">1 kit</td>
                      <td className="p-1 border border-slate-300">Perfil cônico, friso 4mm e anel PU</td>
                      <td className="p-1 border border-slate-300 font-mono">64,00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-medium">Filamento 3D (PETG / PA-CF) + Lastro</td>
                      <td className="p-1 border border-slate-300">1 kit</td>
                      <td className="p-1 border border-slate-300">Chassi, carenagem e 2,9 kg de lastro</td>
                      <td className="p-1 border border-slate-300 font-mono">305,00</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={3} className="p-1.5 border border-slate-300 text-right">Custo Total Projetado:</td>
                      <td className="p-1.5 border border-slate-300 font-mono text-emerald-700">R$ 914,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

            {/* =========================================================================
                PÁGINA 7: ROTEIRO DA DEFESA ORAL (10 MINUTOS PERANTE A BANCA)
               ========================================================================= */}
            <div id="dossier-page-anchor-6" className="no-print p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs px-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                  7
                </span>
                <span className="font-semibold text-white">Página 7: Roteiro Cronometrado da Defesa Oral de 10 Minutos</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Banca Avaliadora</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintSinglePage(6)}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Imprimir somente a Página 7 em PDF vetorial sem renderizar"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Pág. 7 (Vetorial)</span>
                </button>
                <button
                  onClick={() => handleExportSinglePage(6)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="Salvar somente a Página 7 em arquivo PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Salvar Pág. 7 em PDF</span>
                </button>
              </div>
            </div>

            <div className={`pdf-page p-[16mm_20mm] min-h-[297mm] flex flex-col justify-between bg-white text-slate-900 relative ${activePrintPageIndex === 6 ? 'print-active-page' : ''}`}>
              <div className="space-y-4">
                <div className="border-b border-slate-300 pb-2.5 flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-slate-500">
                    Seção 5 • Planejamento da Defesa Oral de 10 Minutos
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Pág. 07</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  6. Roteiro Cronometrado para o Representante da Equipe
                </h2>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  Conforme o <strong>Item 4.1 do Regulamento</strong>, o tempo máximo de defesa perante a banca é de <strong>10 minutos</strong>, realizado logo após a inspeção do protótipo. O roteiro abaixo maximiza a pontuação nos três critérios avaliados pela comissão (Construção e acabamento, Sistemas mecânico/elétrico, Criatividade e estética).
                </p>

                <div className="space-y-2.5 text-[11px] font-sans">
                  <div className="p-2.5 bg-slate-50 border-l-4 border-cyan-500 rounded-r-lg space-y-0.5">
                    <div className="font-bold text-slate-900">
                      [00:00 - 02:00] • Introdução & Conformidade Regulamentar (Critério 1: Dimensões)
                    </div>
                    <p className="text-slate-600 italic text-[10.5px]">
                      "Apresentação da equipe para o Desafio Cavalos de Ferro 2026 (conforme Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf). Nosso protótipo foi projetado sob medida para explorar os limites físicos das 4 provas do edital: bitola exata de 150 mm, altura do engate rigorosamente em 107,5 mm e peso otimizado de 7.650 g, sem nenhuma penalidade dimensional."
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg space-y-0.5">
                    <div className="font-bold text-slate-900">
                      [02:00 - 05:00] • Sistemas Mecânicos & Tração 4x4 (Critério 2: Motorização & Tração)
                    </div>
                    <p className="text-slate-600 italic text-[10.5px]">
                      "Demonstração do trem de força híbrido: Motor DC 775 com planetária metálica 19.2:1 + engrenagens cilíndricas 3:1 + correia dentada GT2 fechada (1:1). Explicar por que não usar trem de engrenagens em cascata (elimina folgas, absorve trancos torcionais e garante 100% de tração nas 4 rodas no Cabo de Guerra e Helpers 20kg)."
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-l-4 border-amber-500 rounded-r-lg space-y-0.5">
                    <div className="font-bold text-slate-900">
                      [05:00 - 07:30] • Sistema Elétrico & Manufatura 3D (Critério 2 e 3: Criatividade)
                    </div>
                    <p className="text-slate-600 italic text-[10.5px]">
                      "Apresentação do sistema de alimentação 100% autônomo (bateria LiPo 4S 14.8V 5200mAh com chave industrial e driver BTS7960 de 43A). Detalhamento dos parâmetros de impressão 3D em PETG com 70% de preenchimento gyroid e fixação integral anti-peças soltas com insertos roscados de latão."
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-l-4 border-emerald-500 rounded-r-lg space-y-0.5">
                    <div className="font-bold text-slate-900">
                      [07:30 - 10:00] • Estratégia de Prova & Arguição da Banca
                    </div>
                    <p className="text-slate-600 italic text-[10.5px]">
                      "Resumo da estratégia nas 4 provas: estabilidade na rampa de 20° com anéis de poliuretano, empuxo no Helpers 20kg e superioridade física no Cabo de Guerra. Abertura formal para as perguntas e considerações dos avaliadores."
                    </p>
                  </div>
                </div>

                {/* Team Signatures Block */}
                <div className="pt-3 grid grid-cols-2 gap-8 text-center text-[11px] font-sans">
                  <div className="border-t border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-900">Representante da Equipe</div>
                    <div className="text-[10px] text-slate-500">Defesa Técnica do Protótipo</div>
                  </div>
                  <div className="border-t border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-900">Membro da Equipe</div>
                    <div className="text-[10px] text-slate-500">Desenvolvimento Mecânico & Elétrico</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2.5 text-[10px] font-sans text-slate-500 flex justify-between">
                <span>Desafio Universitário Cavalos de Ferro 2026</span>
                <span>Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf</span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Sticky Bottom Bar - Exportar Tudo Junto Sempre Visível */}
        <div className="no-print px-5 py-3 bg-slate-950/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xl z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-xs text-slate-300">
              <strong className="text-white">Exportação Unificada:</strong> Todas as 7 seções oficiais reunidas em um único arquivo PDF contínuo (Capa 3D, Regulamento, Desenho 2D, Transmissão 4x4, 4 Provas, Manufatura 3D, Roteiro da Banca).
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
              title="Imprimir todo o projeto junto pelo navegador em vetor puro (sem renderizar)"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimir Tudo Junto (Vetorial)</span>
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-600/25 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Compilar e baixar todo o projeto em um único arquivo PDF"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <FileDown className="w-4 h-4 text-white" />}
              <span>{isGenerating ? 'Compilando Tudo Junto...' : 'Baixar Tudo Junto (1 Arquivo PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
