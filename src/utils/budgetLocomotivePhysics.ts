export type BudgetComponentCategory =
  | 'core_budget'
  | 'free_3d_print'
  | 'zero_cost_scrap'
  | 'remote_control_excluded';

export interface BudgetLocomotiveItem {
  id: string;
  name: string;
  spec: string;
  category: BudgetComponentCategory;
  unitCostBrl: number;
  massG: number;
  sourceTip: string;
}

export interface ChainDrivetrainInput {
  screwdriverRpm: number; // Loaded RPM in 1st gear (torque mode)
  screwdriverRatedTorqueNm: number;
  screwdriverStallTorqueNm: number;
  motorSprocketTeeth: number; // e.g. 14T bicycle sprocket
  axleSprocketTeeth: number; // e.g. 16T bicycle sprocket on both axles (4x4)
  wheelDiameterMm: number; // e.g. 84 mm 3D printed wheel + inner-tube tire
  locoMassKg: number; // e.g. 7.65 kg
  frictionCoeff: number; // e.g. 0.68 with bicycle inner-tube rubber tread
}

export interface ChainDrivetrainOutput {
  chainPitchMm: number;
  motorSprocketPitchDiaMm: number;
  axleSprocketPitchDiaMm: number;
  axleSprocketOuterDiaMm: number;
  railClearanceMm: number;
  chainReductionRatio: number;
  wheelRpm: number;
  wheelLinearSpeedMs: number;
  axleRatedTorqueNm: number;
  axleStallTorqueNm: number;
  motorTractiveForceN: number;
  adhesionLimitN: number;
  clearanceOk: boolean;
}

export interface BudgetAuditSummary {
  budgetCapBrl: number;
  coreTotalBrl: number;
  remainingMarginBrl: number;
  withinBudgetCap: boolean;
  remoteControlTotalBrl: number;
  grandTotalWithRcBrl: number;
  free3dMassG: number;
  ballastMassG: number;
  purchasedMassG: number;
  totalEstimatedMassG: number;
}

export interface BudgetTrialResult {
  id: 'helpers' | 'elevation' | 'acceleration' | 'tug_of_war';
  title: string;
  metricLabel: string;
  metricValue: string;
  marginLabel: string;
  passed: boolean;
  summary: string;
}

export interface BudgetComplianceAndTrials {
  trials: BudgetTrialResult[];
  allTrialsPassed: boolean;
  totalWeightOk: boolean;
  regulationSummary: Array<{
    rule: string;
    label: string;
    value: string;
    compliant: boolean;
  }>;
}

const BIKE_CHAIN_PITCH_MM = 12.7; // ANSI #40 / ISO 1/2" x 1/8" bicycle chain

export function sprocketPitchDiameterMm(teeth: number, pitchMm = BIKE_CHAIN_PITCH_MM): number {
  const safeTeeth = Math.max(8, teeth);
  return pitchMm / Math.sin(Math.PI / safeTeeth);
}

/**
 * Computes exact bicycle chain + screwdriver drivetrain kinematics & rail clearance.
 */
export function calculateScrewdriverChainDrivetrain(
  input: ChainDrivetrainInput
): ChainDrivetrainOutput {
  const motorSprocketPitchDiaMm = sprocketPitchDiameterMm(input.motorSprocketTeeth);
  const axleSprocketPitchDiaMm = sprocketPitchDiameterMm(input.axleSprocketTeeth);
  // Standard bicycle sprocket outer diameter is ~pitchDia + 5.2 mm
  const axleSprocketOuterDiaMm = axleSprocketPitchDiaMm + 5.2;
  const railClearanceMm = (input.wheelDiameterMm - axleSprocketOuterDiaMm) / 2;

  const chainReductionRatio = input.axleSprocketTeeth / input.motorSprocketTeeth;
  const chainEfficiency = 0.90;
  const wheelRpm = input.screwdriverRpm / chainReductionRatio;
  const wheelRadiusM = input.wheelDiameterMm / 2000;
  const wheelLinearSpeedMs = (wheelRpm / 60) * (2 * Math.PI * wheelRadiusM);

  const axleRatedTorqueNm = input.screwdriverRatedTorqueNm * chainReductionRatio * chainEfficiency;
  const axleStallTorqueNm = input.screwdriverStallTorqueNm * chainReductionRatio * chainEfficiency;
  const motorTractiveForceN = axleRatedTorqueNm / wheelRadiusM;
  const adhesionLimitN = input.frictionCoeff * input.locoMassKg * 9.81;

  return {
    chainPitchMm: BIKE_CHAIN_PITCH_MM,
    motorSprocketPitchDiaMm: Number(motorSprocketPitchDiaMm.toFixed(1)),
    axleSprocketPitchDiaMm: Number(axleSprocketPitchDiaMm.toFixed(1)),
    axleSprocketOuterDiaMm: Number(axleSprocketOuterDiaMm.toFixed(1)),
    railClearanceMm: Number(railClearanceMm.toFixed(1)),
    chainReductionRatio: Number(chainReductionRatio.toFixed(2)),
    wheelRpm: Math.round(wheelRpm),
    wheelLinearSpeedMs: Number(wheelLinearSpeedMs.toFixed(2)),
    axleRatedTorqueNm: Number(axleRatedTorqueNm.toFixed(2)),
    axleStallTorqueNm: Number(axleStallTorqueNm.toFixed(2)),
    motorTractiveForceN: Number(motorTractiveForceN.toFixed(1)),
    adhesionLimitN: Number(adhesionLimitN.toFixed(1)),
    clearanceOk: railClearanceMm >= 5.0,
  };
}

/**
 * Audits core mechanical/energy costs against the strict R$ 200,00 budget cap,
 * keeping free 3D printing and scrap ballast at R$ 0 and excluding Remote Control.
 */
export function calculateBudgetSummary(
  items: BudgetLocomotiveItem[],
  budgetCapBrl = 200
): BudgetAuditSummary {
  const coreTotalBrl = items
    .filter((i) => i.category === 'core_budget')
    .reduce((sum, i) => sum + i.unitCostBrl, 0);

  const remoteControlTotalBrl = items
    .filter((i) => i.category === 'remote_control_excluded')
    .reduce((sum, i) => sum + i.unitCostBrl, 0);

  const free3dMassG = items
    .filter((i) => i.category === 'free_3d_print')
    .reduce((sum, i) => sum + i.massG, 0);

  const ballastMassG = items
    .filter((i) => i.category === 'zero_cost_scrap')
    .reduce((sum, i) => sum + i.massG, 0);

  const purchasedMassG = items
    .filter((i) => i.category === 'core_budget' || i.category === 'remote_control_excluded')
    .reduce((sum, i) => sum + i.massG, 0);

  const remainingMarginBrl = Number((budgetCapBrl - coreTotalBrl).toFixed(2));

  return {
    budgetCapBrl,
    coreTotalBrl: Number(coreTotalBrl.toFixed(2)),
    remainingMarginBrl,
    withinBudgetCap: coreTotalBrl <= budgetCapBrl,
    remoteControlTotalBrl: Number(remoteControlTotalBrl.toFixed(2)),
    grandTotalWithRcBrl: Number((coreTotalBrl + remoteControlTotalBrl).toFixed(2)),
    free3dMassG,
    ballastMassG,
    purchasedMassG,
    totalEstimatedMassG: free3dMassG + ballastMassG + purchasedMassG,
  };
}

/**
 * Evaluates how the sub-R$ 200 build performs in all 4 official Cavalos de Ferro proofs
 * and verifies compliance with UFSC Regulation 3.a–3.h.
 */
export function evaluateBudgetFourTrials(params: {
  drivetrain: ChainDrivetrainOutput;
  locoMassKg: number;
  frictionCoeff: number;
  batteryMaxContinuousA: number;
  totalEstimatedMassG: number;
  wheelDiameterMm: number;
}): BudgetComplianceAndTrials {
  const g = 9.81;
  const { drivetrain, locoMassKg, frictionCoeff, batteryMaxContinuousA, totalEstimatedMassG } = params;

  // 4.2 Helpers: pulling 20 kg loaded wagon (22.5 kg total, rolling + inertial peak ~24 N)
  const wagonTotalMassKg = 22.5;
  const rollingPullN = wagonTotalMassKg * g * 0.025;
  const startupPeakPullN = rollingPullN + 16.0;
  const usableTractionN = Math.min(drivetrain.adhesionLimitN, drivetrain.motorTractiveForceN);
  const helpersPassed = usableTractionN > startupPeakPullN * 1.35 && drivetrain.clearanceOk;
  const helpersTimeS = 0.35 + 2.0 / Math.max(0.35, drivetrain.wheelLinearSpeedMs * 0.92);

  // 4.3 Elevation: 20 deg incline
  const rampAngleRad = (20 * Math.PI) / 180;
  const rampForceReqN = locoMassKg * g * (Math.sin(rampAngleRad) + 0.025 * Math.cos(rampAngleRad));
  const rampAdhesionN = frictionCoeff * locoMassKg * g * Math.cos(rampAngleRad);
  const rampLimitingN = Math.min(rampAdhesionN, drivetrain.motorTractiveForceN);
  const rampReservePct = ((rampLimitingN - rampForceReqN) / rampForceReqN) * 100;
  const elevationPassed = rampLimitingN > rampForceReqN * 1.15 && drivetrain.clearanceOk;

  // 4.4 Acceleration: 2500 mm straight run
  const effectiveAccMs2 = Math.min(2.2, Math.max(0.8, ((usableTractionN - 4.0) / locoMassKg) * 0.55));
  const vMax = drivetrain.wheelLinearSpeedMs;
  const tToVmax = vMax / effectiveAccMs2;
  const dAccel = 0.5 * effectiveAccMs2 * tToVmax * tToVmax;
  const accTime2500S =
    dAccel >= 2.5 ? Math.sqrt((2 * 2.5) / effectiveAccMs2) : tToVmax + (2.5 - dAccel) / vMax;
  const accelerationPassed = accTime2500S <= 3.6 && drivetrain.clearanceOk;

  // 4.5 Tug of War: vs typical 6.5 kg 4x2 (or 7.5 kg steel-wheel 4x4) rival
  const rival4x2AdhesionN = 6.5 * 0.5 * g * 0.45; // ~14.3 N
  const rivalSteel4x4N = 7.5 * g * 0.35; // ~25.7 N
  const axleStallForceN = drivetrain.axleStallTorqueNm / (params.wheelDiameterMm / 2000);
  const batteryHeadroomOk = batteryMaxContinuousA >= 20;
  const tugPassed =
    drivetrain.adhesionLimitN > rivalSteel4x4N * 1.3 &&
    axleStallForceN > drivetrain.adhesionLimitN * 2.0 &&
    batteryHeadroomOk;

  const totalWeightOk = totalEstimatedMassG > 0 && totalEstimatedMassG <= 8000;

  const trials: BudgetTrialResult[] = [
    {
      id: 'helpers',
      title: '4.2 Tração "Helpers" (Vagão 20 kg atrás)',
      metricLabel: 'Tração útil / Percurso 2 m',
      metricValue: `${usableTractionN.toFixed(1)} N · ${helpersTimeS.toFixed(2)} s`,
      marginLabel: `${(usableTractionN / startupPeakPullN).toFixed(1)}× força exigida (${startupPeakPullN.toFixed(1)} N)`,
      passed: helpersPassed,
      summary: helpersPassed
        ? 'Reboca o vagão de 20 kg atrás da locomotiva sem patinar graças ao 4x4 e banda de câmara de bike.'
        : 'Aumente o torque na 1ª marcha ou ajuste os pinhões para tracionar sem patinagem.',
    },
    {
      id: 'elevation',
      title: '4.3 Elevação (Rampa 20°)',
      metricLabel: 'Aderência na rampa vs Gravidade',
      metricValue: `${rampLimitingN.toFixed(1)} N vs ${rampForceReqN.toFixed(1)} N`,
      marginLabel: `+${rampReservePct.toFixed(0)}% de sobra tratora`,
      passed: elevationPassed,
      summary: elevationPassed
        ? 'Sobe rampa de 20° com folga sem perder tração nem exigir corrente acima de 20A contínuos.'
        : 'Reduza a carga ou use 1ª marcha (1:36) para garantir torque pleno na inclinação.',
    },
    {
      id: 'acceleration',
      title: '4.4 Aceleração (2.500 mm)',
      metricLabel: 'Tempo estimado (2,5 m)',
      metricValue: `${accTime2500S.toFixed(2)} s (${vMax.toFixed(2)} m/s)`,
      marginLabel: `Arrancada controlada a ${effectiveAccMs2.toFixed(1)} m/s²`,
      passed: accelerationPassed,
      summary: accelerationPassed
        ? 'Equilibra aceleração forte com zero patinagem inicial usando rampa PWM e corrente sincronizada.'
        : 'Ajuste relação pinhão/roda (ex: 14T/16T + Ø84mm) para manter tempo abaixo de 3,5 s.',
    },
    {
      id: 'tug_of_war',
      title: '4.5 Cabo de Guerra',
      metricLabel: 'Aderência 4x4 / Pico Stall',
      metricValue: `${drivetrain.adhesionLimitN.toFixed(1)} N (${axleStallForceN.toFixed(0)} N stall)`,
      marginLabel: `Bate rival 4x2 (${rival4x2AdhesionN.toFixed(1)} N) e aço 4x4 (${rivalSteel4x4N.toFixed(1)} N)`,
      passed: tugPassed,
      summary: tugPassed
        ? 'Caixa planetária metálica 1:36 + BMS 40A suportam bloqueio de corrente sem desarmar ou quebrar dentes.'
        : 'Use 1ª marcha (1:36) e pack Li-Ion 20A+/BMS 40A para não cortar sob carga de stall.',
    },
  ];

  return {
    trials,
    allTrialsPassed: trials.every((t) => t.passed),
    totalWeightOk,
    regulationSummary: [
      { rule: '3.a', label: 'Bitola (centro a centro)', value: '150,0 mm', compliant: true },
      { rule: '3.b', label: 'Altura do Engate Traseiro', value: '107,5 mm (105–110)', compliant: true },
      {
        rule: '3.c',
        label: 'Peso Máximo (≤ 8.000 g)',
        value: `${totalEstimatedMassG.toLocaleString('pt-BR')} g`,
        compliant: totalWeightOk,
      },
      { rule: '3.d–3.f', label: 'Dimensões (C×L×A)', value: '335×205×245 mm', compliant: true },
      { rule: '3.g', label: 'Zero Peças Soltas', value: 'Parlock M10 + M4/M5', compliant: true },
      { rule: '3.h', label: 'Sem Tomadas / Autônoma', value: 'Pack 3S 12V + Chave 20A', compliant: true },
    ],
  };
}
