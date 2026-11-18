import React, { useMemo, useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Cog,
  Radio,
  Printer,
  Wrench,
  RotateCcw,
  ShieldCheck,
  BatteryCharging,
  Zap,
  Trophy,
  ClipboardCheck,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import {
  BudgetLocomotiveItem,
  BudgetMotorPurchaseOption,
  calculateBudgetSummary,
  calculateScrewdriverChainDrivetrain,
  evaluateBudgetFourTrials,
} from '../utils/budgetLocomotivePhysics';
import {
  BUDGET_200_CORE_ITEMS_OUTLET,
  BUDGET_200_MOTOR_OPTIONS,
  BUDGET_200_RC_OPTIONS,
  DEFAULT_LOCOMOTIVE_SPECS,
} from '../data/locomotiveData';
import { LocomotiveSpecs, TransmissionConfig } from '../types/locomotive';

interface Props {
  isBudget200Active: boolean;
  specs: LocomotiveSpecs;
  onActivateBudget200: (payload: {
    specs: LocomotiveSpecs;
    transmission: TransmissionConfig;
    ratedRpm: number;
    ratedTorqueNm: number;
    stallTorqueNm: number;
  }) => void;
}

export const BudgetLocomotiveBuilder: React.FC<Props> = ({
  isBudget200Active,
  specs,
  onActivateBudget200,
}) => {
  const [coreItems, setCoreItems] = useState<BudgetLocomotiveItem[]>(BUDGET_200_CORE_ITEMS_OUTLET);
  const [selectedMotorId, setSelectedMotorId] = useState<string>(BUDGET_200_MOTOR_OPTIONS[0].id);
  const [selectedRcId, setSelectedRcId] = useState<'rc-esp32' | 'rc-flysky'>('rc-esp32');
  const [motorSprocketTeeth, setMotorSprocketTeeth] = useState<number>(14);
  const [axleSprocketTeeth, setAxleSprocketTeeth] = useState<number>(16);
  const [wheelDiameterMm, setWheelDiameterMm] = useState<number>(84);
  const [screwdriverGear, setScrewdriverGear] = useState<'gear1' | 'gear2'>('gear1');

  const selectedMotorOption: BudgetMotorPurchaseOption = useMemo(
    () => BUDGET_200_MOTOR_OPTIONS.find((m) => m.id === selectedMotorId) || BUDGET_200_MOTOR_OPTIONS[0],
    [selectedMotorId]
  );

  const selectedRcOption = useMemo(
    () => BUDGET_200_RC_OPTIONS.find((o) => o.id === selectedRcId) || BUDGET_200_RC_OPTIONS[0],
    [selectedRcId]
  );

  const combinedItems: BudgetLocomotiveItem[] = useMemo(
    () => [...coreItems, ...selectedRcOption.items],
    [coreItems, selectedRcOption]
  );

  const budgetAudit = useMemo(() => calculateBudgetSummary(combinedItems, 200), [combinedItems]);

  const screwdriverRpm =
    screwdriverGear === 'gear1' ? selectedMotorOption.gear1Rpm : selectedMotorOption.gear2Rpm;
  const screwdriverRatedTorqueNm =
    screwdriverGear === 'gear1'
      ? selectedMotorOption.gear1RatedTorqueNm
      : selectedMotorOption.gear2RatedTorqueNm;
  const screwdriverStallTorqueNm =
    screwdriverGear === 'gear1'
      ? selectedMotorOption.gear1StallTorqueNm
      : selectedMotorOption.gear2StallTorqueNm;

  const locoMassKg = Number((budgetAudit.totalEstimatedMassG / 1000).toFixed(2));

  const chainPhysics = useMemo(
    () =>
      calculateScrewdriverChainDrivetrain({
        screwdriverRpm,
        screwdriverRatedTorqueNm,
        screwdriverStallTorqueNm,
        motorSprocketTeeth,
        axleSprocketTeeth,
        wheelDiameterMm,
        locoMassKg,
        frictionCoeff: 0.68,
      }),
    [
      screwdriverRpm,
      screwdriverRatedTorqueNm,
      screwdriverStallTorqueNm,
      motorSprocketTeeth,
      axleSprocketTeeth,
      wheelDiameterMm,
      locoMassKg,
    ]
  );

  const fourTrialsEvaluation = useMemo(
    () =>
      evaluateBudgetFourTrials({
        drivetrain: chainPhysics,
        locoMassKg,
        frictionCoeff: 0.68,
        batteryMaxContinuousA: 20,
        totalEstimatedMassG: budgetAudit.totalEstimatedMassG,
        wheelDiameterMm,
      }),
    [chainPhysics, locoMassKg, budgetAudit.totalEstimatedMassG, wheelDiameterMm]
  );

  const handleSelectMotor = (motorId: string) => {
    const motorOpt =
      BUDGET_200_MOTOR_OPTIONS.find((m) => m.id === motorId) || BUDGET_200_MOTOR_OPTIONS[0];
    setSelectedMotorId(motorOpt.id);

    const defaultBattery = BUDGET_200_CORE_ITEMS_OUTLET.find((i) => i.id === 'b-battery')!;
    setCoreItems((prev) =>
      prev.map((item) => {
        if (item.id === 'b-motor') {
          return {
            ...item,
            name: motorOpt.name,
            spec: motorOpt.spec,
            unitCostBrl: motorOpt.motorPriceBrl,
            massG: motorOpt.massG,
            purchaseUrl: motorOpt.purchaseUrl,
            purchaseLabel: motorOpt.purchaseLabel,
          };
        }
        if (item.id === 'b-battery') {
          if (motorOpt.batteryIncluded) {
            return {
              ...item,
              name: motorOpt.batteryOverrideName || defaultBattery.name,
              spec: motorOpt.batteryOverrideSpec || defaultBattery.spec,
              unitCostBrl: motorOpt.batteryOverridePriceBrl,
              sourceTip: 'Inclusa no Kit Parafusadeira 12V c/ carregador bivolt',
              purchaseUrl: motorOpt.purchaseUrl,
              purchaseLabel: 'Inclusa no Kit',
            };
          }
          return {
            ...defaultBattery,
            unitCostBrl: motorOpt.batteryOverridePriceBrl,
          };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (id: string, value: number) => {
    const safeVal = Number.isNaN(value) ? 0 : Math.max(0, Math.min(500, value));
    setCoreItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitCostBrl: safeVal } : item))
    );
  };

  const applyBudgetPreset = (preset: 'outlet' | 'scrap') => {
    if (preset === 'outlet') {
      setSelectedMotorId(BUDGET_200_MOTOR_OPTIONS[0].id);
      setCoreItems(BUDGET_200_CORE_ITEMS_OUTLET);
      return;
    }
    setCoreItems((prev) =>
      prev.map((item) => {
        if (item.id === 'b-motor') return { ...item, unitCostBrl: Math.min(item.unitCostBrl, 48) };
        if (item.id === 'b-battery') return { ...item, unitCostBrl: item.unitCostBrl === 0 ? 0 : 38 };
        if (item.id === 'b-axles') return { ...item, unitCostBrl: 16 };
        if (item.id === 'b-sprockets') return { ...item, unitCostBrl: 22 };
        if (item.id === 'b-chain') return { ...item, unitCostBrl: 18 };
        if (item.id === 'b-fasteners') return { ...item, unitCostBrl: 7 };
        return item;
      })
    );
  };

  const handleActivateInSimulator = () => {
    const updatedSpecs: LocomotiveSpecs = {
      ...DEFAULT_LOCOMOTIVE_SPECS,
      chassisWeightG: 1420,
      shellWeightG: 480,
      motorGearboxWeightG: 860, // Parafusadeira 12V + pinhão 14T + corrente + fixadores
      batteryWeightG: 240, // Pack Li-Ion 3S 12V 20A/40A BMS
      wheelsetBearingsWeightG: 778, // 2 eixos aço 10mm + 4 rodas 3D + 2 pinhões 16T + RC
      ballastWeightG: 3870, // Lastro gratuito de sucata ferrosa/arruelas no chassi
      totalWeightGrams: budgetAudit.totalEstimatedMassG,
      wheelFrictionCoeff: 0.68, // Câmara de ar de bicicleta sobre trilho
    };

    const updatedTransmission: TransmissionConfig = {
      motorRpm: screwdriverRpm,
      motorPinionTeeth: motorSprocketTeeth,
      drivenGearTeeth: axleSprocketTeeth,
      internalGearboxRatio: screwdriverGear === 'gear1' ? 36 : 12,
      pulleyWheelAxle1Teeth: axleSprocketTeeth,
      pulleyWheelAxle2Teeth: axleSprocketTeeth,
      wheelbaseMm: 160,
      wheelDiameterMm,
      beltPitchMm: 12.7,
      beltWidthMm: 8,
    };

    onActivateBudget200({
      specs: updatedSpecs,
      transmission: updatedTransmission,
      ratedRpm: screwdriverRpm,
      ratedTorqueNm: screwdriverRatedTorqueNm,
      stallTorqueNm: screwdriverStallTorqueNm,
    });
  };

  const getCategoryTag = (category: BudgetLocomotiveItem['category']) => {
    if (category === 'free_3d_print') {
      return { text: 'IMPRESSÃO 3D GRATUITA', color: 'text-cyan-400' };
    }
    if (category === 'zero_cost_scrap') {
      return { text: 'OFICINA / CUSTO ZERO', color: 'text-emerald-400' };
    }
    return { text: 'COMPRA NO TETO', color: 'text-amber-400' };
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Summary KPIs */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 border-b border-slate-800 pb-5">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Wallet className="w-4 h-4" />
              <span>
                Especificação Completa ≤ R$ 200 · RS-550 1:36 + Li-Ion 3S 20A + Corrente 4x4 · Impressão 3D Gratuita
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
              Configuração Competitiva ≤ R$ 200: Motor, Bateria e Kit Completo 100% no Regulamento
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Combinação fechada para pontuar alto nas 4 provas sem estourar o orçamento: <strong>Motor RS-550 c/ Planetária Metálica 1:36</strong>,{' '}
              <strong>Pack Li-Ion 12V Alta Descarga (20A contínuos / BMS 40A)</strong>, 2 eixos Ø10 mm, 3 pinhões (14T/16T) e corrente de bike,
              kit de fixação antissoltas + chave geral (Regras 3.g/3.h) e <strong>4 rodas + chassi 3D gratuitos (R$ 0,00)</strong>. Controle remoto fora do teto.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleActivateInSimulator}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isBudget200Active
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-900/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isBudget200Active
                  ? 'Configuração ≤ R$ 200 Ativa — Atualizar Simulador'
                  : 'Ativar Locomotiva ≤ R$ 200 no Simulador'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {isBudget200Active
                ? `Ativo nas 4 Provas · Massa: ${specs.totalWeightGrams} g`
                : `Envia RS-550 1:36 + Bateria 3S 20A + Roda Ø${wheelDiameterMm}mm para o simulador`}
            </span>
          </div>
        </div>

        {/* 4 KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div
            className={`p-4 rounded-xl border ${
              budgetAudit.withinBudgetCap
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-red-950/20 border-red-500/40'
            }`}
          >
            <div className="text-xs text-slate-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Gasto Núcleo Completo
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  budgetAudit.withinBudgetCap
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {budgetAudit.withinBudgetCap ? 'DENTRO DO TETO' : 'ACIMA DE R$ 200'}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span
                className={`text-2xl font-mono font-bold tabular-nums whitespace-nowrap ${
                  budgetAudit.withinBudgetCap ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                R$ {budgetAudit.coreTotalBrl.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                / Teto R$ 200,00
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {budgetAudit.withinBudgetCap
                ? `Folga de R$ ${budgetAudit.remainingMarginBrl.toFixed(2)} abaixo do teto (já inclui parafusos e chave geral)`
                : `Excedeu o limite em R$ ${Math.abs(budgetAudit.remainingMarginBrl).toFixed(2)}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Serviço de Impressão 3D</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums whitespace-nowrap">
                R$ 0,00
              </span>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                ({budgetAudit.free3dMassG} g)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Chassi 150 mm, 4 rodas Ø {wheelDiameterMm} mm, suportes, esticador e engate 107,5 mm
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Cog className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Tração 4x4 Corrente Bike</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums whitespace-nowrap">
                {chainPhysics.adhesionLimitN} N
              </span>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                ({chainPhysics.wheelLinearSpeedMs} m/s)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Força motor {chainPhysics.motorTractiveForceN} N · Vão trilho {chainPhysics.railClearanceMm} mm ({chainPhysics.clearanceOk ? 'Seguro' : 'Risco'})
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
            <div className="text-xs text-slate-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                Controle Remoto
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                FORA DO TETO
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-mono font-bold text-purple-300 tabular-nums whitespace-nowrap">
                + R$ {budgetAudit.remoteControlTotalBrl.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                (Total R$ {budgetAudit.grandTotalWithRcBrl.toFixed(0)})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Orçado separado do limite de R$ 200 (motor/bateria/eixos/corrente/kit 3.g)
            </p>
          </div>
        </div>
      </section>

      {/* Purchasable Motor Selector (Strict <= R$ 200) */}
      <section className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Selecione o Motor para Compra (Todos dentro do teto de R$ 200,00)
              </h3>
              <p className="text-xs text-slate-400">
                Clique em uma opção para atualizar automaticamente o orçamento, os links de compra, a física e as 4 provas
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40">
            Motor Ativo: {selectedMotorOption.shortName}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {BUDGET_200_MOTOR_OPTIONS.map((opt) => {
            const isSelected = opt.id === selectedMotorOption.id;
            return (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-amber-950/25 border-amber-400 shadow-lg shadow-amber-900/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {opt.badge}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      R$ {opt.motorPriceBrl.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {opt.shortName}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {opt.highlights}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono tabular-nums">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">1ª Marcha</div>
                      <div className="text-amber-300 font-bold">{opt.gear1Rpm} RPM</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Stall</div>
                      <div className="text-emerald-400 font-bold">{opt.gear1StallTorqueNm} N.m</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Bateria</div>
                      <div className="text-cyan-300 font-bold">
                        {opt.batteryIncluded ? 'Inclusa (R$0)' : `+R$ ${opt.batteryOverridePriceBrl}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleSelectMotor(opt.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Motor Selecionado ✓' : 'Selecionar Este Motor'}
                  </button>
                  <a
                    href={opt.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 transition-colors whitespace-nowrap"
                  >
                    <span>Comprar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chosen Motor & Battery Technical Selection */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-white leading-snug">
                {selectedMotorOption.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={selectedMotorOption.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
              >
                <span>{selectedMotorOption.purchaseLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                R$ {(coreItems.find((i) => i.id === 'b-motor')?.unitCostBrl ?? selectedMotorOption.motorPriceBrl).toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Operando em <strong>1ª marcha ({selectedMotorOption.gear1Rpm} RPM)</strong> com redução por corrente 14T → 16T. As engrenagens planetárias metálicas entregam{' '}
            <strong>{selectedMotorOption.gear1StallTorqueNm} N.m de pico ({chainPhysics.axleStallTorqueNm} N.m nos eixos)</strong> sem risco de quebra no Cabo de Guerra e atingem{' '}
            <strong>{chainPhysics.wheelLinearSpeedMs} m/s</strong> com pinhão {motorSprocketTeeth}T → {axleSprocketTeeth}T.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Saída 1ª Marcha</div>
              <div className="text-amber-300 font-bold mt-0.5">{selectedMotorOption.gear1Rpm} RPM</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Torque Nom/Stall</div>
              <div className="text-emerald-400 font-bold mt-0.5">
                {selectedMotorOption.gear1RatedTorqueNm} / {selectedMotorOption.gear1StallTorqueNm} N.m
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Corrente Pico</div>
              <div className="text-cyan-400 font-bold mt-0.5">{selectedMotorOption.peakCurrentA} A (12 V)</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-white leading-snug">
                {selectedMotorOption.batteryIncluded
                  ? 'Bateria 12V Inclusa no Kit Parafusadeira'
                  : 'Bateria Escolhida: Pack Li-Ion 3S 12V (20A / BMS 40A)'}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={coreItems.find((i) => i.id === 'b-battery')?.purchaseUrl || selectedMotorOption.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
              >
                <span>{selectedMotorOption.batteryIncluded ? 'Ver no Kit' : 'Comprar Pack 3S'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                R$ {(coreItems.find((i) => i.id === 'b-battery')?.unitCostBrl ?? 52).toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedMotorOption.batteryIncluded ? (
              <>
                Inclusa na compra do <strong>Kit Parafusadeira 12V c/ Carregador Bivolt (R$ 0 extras)</strong>. Para cargas extremas no Cabo de Guerra, evite travar o eixo por mais de 3s contínuos para não acionar a proteção do BMS original.
              </>
            ) : (
              <>
                Células <strong>18650 de alta descarga (2.500 mAh, 20A contínuos)</strong> com placa <strong>BMS 40A</strong> embutida no chassi. Evita queda brusca de tensão e corte do BMS quando o motor puxa 25–35A subindo a rampa de 20° ou travado no Cabo de Guerra (Regra 3.h).
              </>
            )}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Tensão Pack 3S</div>
              <div className="text-emerald-400 font-bold mt-0.5">11,1 – 12,6 V</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Descarga / BMS</div>
              <div className="text-amber-300 font-bold mt-0.5">20 A / 40 A</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Massa Pack</div>
              <div className="text-cyan-400 font-bold mt-0.5">240 g (Interna)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Expected Performance Across All 4 Official Trials + Regulation Compliance */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Desempenho Previsto nas 4 Provas &amp; Conformidade com o Regulamento
              </h3>
              <p className="text-xs text-slate-400">
                Atualizado em tempo real pelos pinhões, diâmetro das rodas 3D e marcha selecionada abaixo
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              fourTrialsEvaluation.allTrialsPassed && fourTrialsEvaluation.totalWeightOk
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}
          >
            {fourTrialsEvaluation.allTrialsPassed && fourTrialsEvaluation.totalWeightOk
              ? '4/4 PROVAS APROVADAS + REGULAMENTO OK'
              : 'AJUSTE MARCHA/PINHÃO PARA MÁXIMO DESEMPENHO'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fourTrialsEvaluation.trials.map((trial) => (
            <div
              key={trial.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-2.5 ${
                trial.passed
                  ? 'bg-slate-950/80 border-emerald-500/30'
                  : 'bg-red-950/20 border-red-500/40'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white leading-snug">{trial.title}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      trial.passed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {trial.passed ? 'OK' : 'AJUSTE'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{trial.metricLabel}</div>
                <div className="text-sm font-mono font-bold text-cyan-300 tabular-nums">
                  {trial.metricValue}
                </div>
                <div className="text-[11px] font-mono text-amber-300">{trial.marginLabel}</div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2">
                {trial.summary}
              </p>
            </div>
          ))}
        </div>

        {/* Regulation 3.a - 3.h Quick Audit Bar */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Conferência do Edital Cavalos de Ferro 2026 (Itens 3.a a 3.h):</span>
            </div>
            <a
              href="/assets/aistudio/Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono font-normal text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              Ref.: Regulamento-Cavalos-de-Ferro-2026_ef665518.pdf
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {fourTrialsEvaluation.regulationSummary.map((item) => (
              <div
                key={item.rule}
                className={`p-2.5 rounded-lg border ${
                  item.compliant
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-red-950/30 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>Regra {item.rule}</span>
                  <span className={item.compliant ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {item.compliant ? 'OK' : 'EXCEDE'}
                  </span>
                </div>
                <div className="font-semibold text-white text-[11px] mt-0.5 truncate">{item.label}</div>
                <div className="font-mono text-[11px] text-cyan-300 mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Drivetrain Engineering + Schematic Stage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Bicycle Chain + Screwdriver Sizing */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Transmissão 4x4 por Corrente de Bicicleta
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Passo 1/2&quot; (12,7 mm) · Confira folga dos pinhões no trilho
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyBudgetPreset('outlet')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Restaurar orçamento padrão (R$ 196)"
                aria-label="Restaurar orçamento padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Screwdriver Speed Selector */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 font-medium block">
                Seletor Mecânico da Parafusadeira 12V:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScrewdriverGear('gear1')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-colors cursor-pointer ${
                    screwdriverGear === 'gear1'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  1ª Marcha (Torque · {selectedMotorOption.gear1Rpm} RPM)
                </button>
                <button
                  type="button"
                  onClick={() => setScrewdriverGear('gear2')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-colors cursor-pointer ${
                    screwdriverGear === 'gear2'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  2ª Marcha (Velocidade · {selectedMotorOption.gear2Rpm} RPM)
                </button>
              </div>
            </div>

            {/* Chain Sprocket & Wheel Sliders */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-motor-sprocket" className="text-slate-300 font-medium">
                    Pinhão de Bike no Motor (Parafusadeira)
                  </label>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {motorSprocketTeeth}T (Øp {chainPhysics.motorSprocketPitchDiaMm} mm)
                  </span>
                </div>
                <input
                  id="slider-motor-sprocket"
                  type="range"
                  min={12}
                  max={18}
                  step={1}
                  value={motorSprocketTeeth}
                  onChange={(e) => setMotorSprocketTeeth(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-axle-sprocket" className="text-slate-300 font-medium">
                    2× Rodas Dentadas nos Eixos 4x4
                  </label>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">
                    {axleSprocketTeeth}T (Øext {chainPhysics.axleSprocketOuterDiaMm} mm)
                  </span>
                </div>
                <input
                  id="slider-axle-sprocket"
                  type="range"
                  min={14}
                  max={20}
                  step={1}
                  value={axleSprocketTeeth}
                  onChange={(e) => setAxleSprocketTeeth(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="slider-budget-wheel" className="text-slate-300 font-medium">
                    Diâmetro das 4 Rodas (Impressão 3D Gratuita)
                  </label>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    Ø {wheelDiameterMm} mm
                  </span>
                </div>
                <input
                  id="slider-budget-wheel"
                  type="range"
                  min={74}
                  max={94}
                  step={2}
                  value={wheelDiameterMm}
                  onChange={(e) => setWheelDiameterMm(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Rail clearance alert & mechanical summary */}
          <div className="space-y-2.5">
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                chainPhysics.clearanceOk
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              {chainPhysics.clearanceOk ? (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>
                Vão livre entre pinhão {axleSprocketTeeth}T e o topo do trilho:{' '}
                <strong className="font-mono">{chainPhysics.railClearanceMm} mm</strong>{' '}
                {chainPhysics.clearanceOk
                  ? '(Folga segura contra raspagem)'
                  : '(Aumente a roda 3D ou reduza o pinhão dos eixos!)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-400">Relação corrente:</span>
                <span className="text-white font-bold">{chainPhysics.chainReductionRatio} : 1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giro nas rodas:</span>
                <span className="text-cyan-400 font-bold">{chainPhysics.wheelRpm} RPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Torque 4WD:</span>
                <span className="text-amber-400 font-bold">{chainPhysics.axleRatedTorqueNm} N.m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pico Stall:</span>
                <span className="text-emerald-400 font-bold">{chainPhysics.axleStallTorqueNm} N.m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: SVG Drivetrain & Clearance Schematic */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Arquitetura 4x4: Parafusadeira 12V + Corrente de Bicicleta + 4 Rodas 3D
              </h3>
              <p className="text-xs text-slate-400">
                Loop contínuo de corrente 1/2&quot;×1/8&quot; sincronizando os 2 eixos de aço (entre-eixos 160 mm, bitola 150 mm)
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 tabular-nums">
              Passo {chainPhysics.chainPitchMm} mm · Roda Ø{wheelDiameterMm} mm
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-hidden">
            <svg
              viewBox="0 0 760 270"
              className="w-full h-auto block"
              role="img"
              aria-label="Esquema da locomotiva econômica com motor de parafusadeira, bateria 12V, pinhões e corrente de bicicleta e 4 rodas 3D"
            >
              <defs>
                <pattern id="budgetGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                </pattern>
              </defs>

              <rect width="760" height="270" fill="#020617" />
              <rect width="760" height="270" fill="url(#budgetGrid)" />

              {/* Steel Rail Line */}
              <rect x="45" y="232" width="670" height="6" rx="2" fill="#475569" />
              <text x="60" y="254" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                TRILHO · VÃO PINHÃO-TRILHO: {chainPhysics.railClearanceMm} mm
              </text>
              <text x="700" y="254" textAnchor="end" fill="#22d3ee" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                CHASSI 3D GRATUITO (BITOLA 150 mm · ENGATE 107,5 mm)
              </text>

              {/* Free 3D Printed Modular Frame Outline */}
              <rect x="115" y="110" width="520" height="58" rx="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="5 3" />

              {/* Screwdriver 12V Motor + Planetary Gearbox (Top Center-Left) */}
              <rect x="270" y="42" width="128" height="44" rx="5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.6" />
              <rect x="398" y="48" width="44" height="32" rx="3" fill="#475569" stroke="#fde047" strokeWidth="1.2" />
              <text x="334" y="61" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                {selectedMotorOption.id === 'motor-redutor-rs550-320' ? 'RS-550 (320 RPM)' : `RS-550 12V (${selectedMotorOption.gear1Rpm} RPM)`}
              </text>
              <text x="334" y="75" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {selectedMotorOption.batteryIncluded ? 'Kit Parafusadeira' : 'Planetária Metálica'}
              </text>

              {/* Battery 12V Li-Ion 20A/40A BMS (Left Inside Chassis) */}
              <rect x="128" y="54" width="102" height="40" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
              <text x="179" y="72" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">
                {selectedMotorOption.batteryIncluded ? 'BATERIA KIT 12V' : 'BATERIA 3S 12V'}
              </text>
              <text x="179" y="84" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontFamily="monospace">
                {selectedMotorOption.batteryIncluded ? 'Inclusa no Kit' : '20A / BMS 40A'}
              </text>

              {/* Remote Control System Box (OUTSIDE R$200 CAP, Right Side) */}
              <rect x="526" y="44" width="146" height="46" rx="5" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="599" y="62" textAnchor="middle" fill="#e9d5ff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                CONTROLE REMOTO
              </text>
              <text x="599" y="76" textAnchor="middle" fill="#d8b4fe" fontSize="8" fontFamily="monospace">
                {selectedRcId === 'rc-esp32' ? 'ESP32 + Ponte H 43A' : 'RC 2.4GHz + ESC 60A'}
              </text>
              <text x="599" y="37" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                (FORA DO TETO R$ 200)
              </text>

              {/* Rear & Front 3D Printed Wheels (84mm) + Steel Axles */}
              {[230, 510].map((wx) => (
                <g key={wx} transform={`translate(${wx}, 182)`}>
                  <circle cx="0" cy="0" r="48" fill="#1e293b" stroke="#10b981" strokeWidth="3.5" />
                  <circle cx="0" cy="0" r="44" fill="none" stroke="#334155" strokeWidth="2" />
                  <circle cx="0" cy="0" r="32" fill="#334155" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" />
                  <circle cx="0" cy="0" r="9" fill="#94a3b8" stroke="#f8fafc" strokeWidth="1.4" />
                </g>
              ))}

              {/* Wheel + Sprocket Callouts Placed Outside Chain Loop */}
              <text x="172" y="182" textAnchor="end" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">
                RODA 3D TRASEIRA
              </text>
              <text x="172" y="195" textAnchor="end" fill="#fbbf24" fontSize="8.5" fontFamily="monospace">
                + Pinhão {axleSprocketTeeth}T (Ø10mm)
              </text>

              <text x="568" y="182" textAnchor="start" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">
                RODA 3D DIANTEIRA
              </text>
              <text x="568" y="195" textAnchor="start" fill="#fbbf24" fontSize="8.5" fontFamily="monospace">
                + Pinhão {axleSprocketTeeth}T (Ø10mm)
              </text>

              {/* Motor Sprocket 14T at x=468, y=64 */}
              <g transform="translate(468, 64)">
                <circle cx="0" cy="0" r="22" fill="#334155" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" />
                <circle cx="0" cy="0" r="6" fill="#e2e8f0" />
                <text x="0" y="-28" textAnchor="middle" fill="#fde047" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  PINHÃO {motorSprocketTeeth}T
                </text>
              </g>

              {/* 3D Printed Chain Tensioner Idler */}
              <g transform="translate(370, 144)">
                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.8" />
                <text x="0" y="-15" textAnchor="middle" fill="#67e8f0" fontSize="8" fontFamily="monospace">
                  Esticador 3D
                </text>
              </g>

              {/* Bicycle Chain Path (Continuous 4x4 Loop) */}
              <path
                d="M 484 52 L 538 164 A 34 34 0 0 1 510 214 L 230 214 A 34 34 0 0 1 208 156 L 454 46 Z"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <rect x="292" y="176" width="156" height="22" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.9" />
              <text x="370" y="190" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                CORRENTE BIKE 1/2&quot;×1/8&quot; (4x4)
              </text>
            </svg>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Dica Prática de Inspeção &amp; Montagem (Regras 3.g e 3.h):</strong> Trave o pinhão {motorSprocketTeeth}T com acoplador hexagonal 1/4&quot; no eixo da planetária e prense cada roda 3D + pinhão {axleSprocketTeeth}T nos eixos de aço <strong>Ø 10 mm</strong> entre duas <strong>porcas travantes Parlock M10</strong>. Instale a <strong>chave geral de 20A</strong> no topo da carenagem e garanta zero peças soltas (tampa do lastro parafusada com M4).
          </div>
        </div>
      </section>

      {/* Budget Tables: Core (<= R$ 200) vs Remote Control (Outside R$ 200 Cap) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core Budget Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Lista Completa de Materiais — Núcleo &amp; Energia (Teto ≤ R$ 200,00)
              </h3>
              <p className="text-xs text-slate-400">
                Inclui motor, bateria 20A, eixos, pinhões, corrente, fixadores de inspeção e peças 3D gratuitas
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => applyBudgetPreset('outlet')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium cursor-pointer"
              >
                Cenário Loja/Outlet (R$ 196)
              </button>
              <button
                type="button"
                onClick={() => applyBudgetPreset('scrap')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-medium cursor-pointer"
              >
                Cenário Oficina/Usados (R$ 149)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-2.5 pr-3">Componente</th>
                  <th className="py-2.5 px-3">Origem / Regra</th>
                  <th className="py-2.5 px-3">Link de Compra</th>
                  <th className="py-2.5 pl-3 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {coreItems.map((item) => {
                  const tag = getCategoryTag(item.category);
                  const isZeroCost = item.category === 'free_3d_print' || item.category === 'zero_cost_scrap';
                  return (
                    <tr key={item.id} className="hover:bg-slate-950/50">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.spec}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className={`inline-block text-[10px] font-mono font-bold mb-0.5 ${tag.color}`}>
                          {tag.text}
                        </span>
                        <div className="text-[11px] text-slate-400">{item.sourceTip}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.purchaseUrl ? (
                          <a
                            href={item.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px] transition-colors"
                          >
                            <span>{item.purchaseLabel || 'Comprar'}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-[10px] ${tag.color}`}>
                            {item.category === 'free_3d_print' ? 'Impressão 3D (R$ 0)' : 'Oficina / Sucata (R$ 0)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {isZeroCost ? (
                          <span className={`${tag.color} font-bold`}>R$ 0,00</span>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                            <span className="text-slate-400">R$</span>
                            <input
                              type="number"
                              min={0}
                              max={500}
                              aria-label={`Preço de ${item.name}`}
                              value={item.unitCostBrl}
                              onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                              className="w-12 bg-transparent text-right text-amber-300 font-bold focus:outline-none"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-950/80 font-mono">
                  <td colSpan={3} className="py-3 px-3 font-bold text-slate-200">
                    Total Núcleo (Motor + Bateria 20A + Eixos + Pinhões + Corrente + Kit 3.g/3.h + 4 Rodas 3D)
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold text-sm tabular-nums whitespace-nowrap ${
                      budgetAudit.withinBudgetCap ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    R$ {budgetAudit.coreTotalBrl.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Remote Control Card (OUTSIDE R$ 200 CAP) */}
        <div className="lg:col-span-5 bg-slate-900 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  Sistema de Controle Remoto
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  FORA DO LIMITE DE R$ 200
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Escolha a eletrônica sem fio embarcada na locomotiva (alimentação 100% autônoma via bateria 12V, cumprindo a Regra 3.h sem cabos ligados na tomada):
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {BUDGET_200_RC_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedRcId(opt.id as 'rc-esp32' | 'rc-flysky')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRcId === opt.id
                      ? 'bg-purple-950/40 border-purple-400 text-white shadow'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span>{opt.label}</span>
                    <span className="font-mono text-purple-300 whitespace-nowrap">
                      + R$ {opt.totalBrl}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2.5 pt-1">
              {selectedRcOption.items.map((rcItem) => (
                <div
                  key={rcItem.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="font-semibold text-white">{rcItem.name}</div>
                    <div className="text-[11px] text-slate-400">{rcItem.spec}</div>
                    {rcItem.purchaseUrl && (
                      <a
                        href={rcItem.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-purple-200 underline underline-offset-2"
                      >
                        <span>{rcItem.purchaseLabel || 'Ver Link de Compra'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="font-mono font-bold text-purple-300 whitespace-nowrap">
                    R$ {rcItem.unitCostBrl}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Núcleo Mecânico (no teto R$ 200):</span>
              <span className="text-emerald-400 font-bold">R$ {budgetAudit.coreTotalBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Controle Remoto (fora do teto):</span>
              <span className="text-purple-300 font-bold">+ R$ {budgetAudit.remoteControlTotalBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Massa Total Pronta (Regra 3.c ≤ 8000 g):</span>
              <span className="text-cyan-300 font-bold">{budgetAudit.totalEstimatedMassG.toLocaleString('pt-BR')} g</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5 text-white font-bold">
              <span>Total Geral Completo c/ RC:</span>
              <span>R$ {budgetAudit.grandTotalWithRcBrl.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
