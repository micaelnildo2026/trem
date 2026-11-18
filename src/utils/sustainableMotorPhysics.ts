export interface CustomMotorInput {
  statorCoils: number; // Múltiplo de 3 (ex: 9, 12, 15)
  rotorPoles: number; // Número par (ex: 10, 14, 16)
  turnsPerCoil: number; // Espiras por bobina (ex: 14 a 45)
  wireDiameterMm: number; // Diâmetro do fio de cobre esmaltado (mm)
  statorMeanRadiusMm: number; // Raio médio das bobinas (mm)
  supplyVoltageV: number; // Tensão nominal da bateria sustentável LiFePO4 (V)
  planetaryRatio: number; // Redução do estágio planetário impresso 3D
  externalGearRatio: number; // Redução externa M1.0 (ex: 45/15 = 3.0)
  wheelDiameterMm: number; // Diâmetro da roda ferroviária (mm)
  continuousCurrentA: number; // Corrente contínua de trabalho (A)
  escPeakCurrentLimitA: number; // Limite de corrente do driver sensored (A)
}

export interface CustomMotorOutput {
  motorOuterDiameterMm: number;
  magneticFluxDensityT: number;
  windingFactor: number;
  copperWireLengthM: number;
  phaseResistanceOhm: number;
  lineToLineResistanceOhm: number;
  kvRpmPerVolt: number;
  ktNmPerAmp: number;
  rawNoLoadRpm: number;
  rawRatedRpm: number;
  rawRatedTorqueNm: number;
  rawStallTorqueNm: number;
  gearboxOutputRpm: number;
  gearboxRatedTorqueNm: number;
  gearboxStallTorqueNm: number;
  axleRpm: number;
  axleTorqueNm: number;
  wheelLinearSpeedMs: number;
  maxMotorTractiveForceN: number;
  copperMassG: number;
  estimatedMotorMassG: number;
  efficiencyPercent: number;
}

export interface SustainabilityBreakdownInput {
  totalLocomotiveWeightG: number;
  printedPartsMassG: number; // rPETG reciclado + PA12-CF + PLA+
  reclaimedMetalMassG: number; // Sucata de aço 1020 para lastro + discos de rotor + eixos reaproveitados
  purchasedElectronicsMassG: number; // Cobre, ímãs N52, rolamentos, LiFePO4, ESC
  usesLeadBallast: boolean; // false = lastro ecológico de sucata ferrosa
  usesCobaltFreeBattery: boolean; // true = LiFePO4 (2000+ ciclos) em vez de LiPo
}

export interface SustainabilityMetrics {
  circularityPercent: number;
  recycledAndPrintedPercent: number;
  co2SavedKg: number;
  toxicLeadEliminatedG: number;
  batteryCycleLifeRatio: number;
  regulationMassCompliant: boolean;
  massMarginG: number;
  verdictLabel: string;
}

export const DEFAULT_CUSTOM_MOTOR_INPUT: CustomMotorInput = {
  statorCoils: 12,
  rotorPoles: 14,
  turnsPerCoil: 20,
  wireDiameterMm: 0.95,
  statorMeanRadiusMm: 30,
  supplyVoltageV: 12.8, // LiFePO4 4S (4 x 3.2V)
  planetaryRatio: 5.0, // Estágio único impresso 3D (Coroa 60T, Sol 15T, Planetas 22T -> 1 + 60/15 = 5:1)
  externalGearRatio: 3.0, // Engrenagem cilíndrica M1.0 15T -> 45T
  wheelDiameterMm: 65,
  continuousCurrentA: 16,
  escPeakCurrentLimitA: 45,
};

/**
 * Calcula os parâmetros eletromagnéticos, cinemáticos e mássicos de um motor
 * de fluxo axial (AFPM) fabricado com estator impresso em 3D, discos de aço 1020,
 * ímãs N52 e estágio redutor planetário impresso.
 */
export function calculateCustomMotorSpecs(input: CustomMotorInput): CustomMotorOutput {
  const coilsPerPhase = Math.max(1, Math.round(input.statorCoils / 3));
  // Fator de enrolamento típico para 12N14P / 12N10P / 9N10P de fluxo axial concentrado
  const windingFactor = input.statorCoils === 12 && input.rotorPoles === 14 ? 0.933 : 0.866;

  // Densidade de fluxo no entreferro com rotor duplo de aço 1020 e ímãs N52 (~0.58 T)
  const magneticFluxDensityT = 0.58;
  const activeRadialLengthM = 0.016; // 16 mm de trecho ativo radial da bobina
  const meanRadiusM = input.statorMeanRadiusMm / 1000;

  // Comprimento médio de uma espira (ida + volta radial + cabeças de bobina)
  const meanTurnLengthM = 2 * activeRadialLengthM + 2 * 0.013;
  const totalTurnsAllCoils = input.statorCoils * input.turnsPerCoil;
  const copperWireLengthM = totalTurnsAllCoils * meanTurnLengthM;

  // Resistência elétrica da fase (ligação Estrela / Y) a 20°C (rho cobre = 1.68e-8 Ohm.m)
  const wireRadiusM = (input.wireDiameterMm / 2) / 1000;
  const wireAreaM2 = Math.PI * wireRadiusM * wireRadiusM;
  const phaseLengthM = coilsPerPhase * input.turnsPerCoil * meanTurnLengthM;
  const phaseResistanceOhm = (1.68e-8 * phaseLengthM) / Math.max(1e-9, wireAreaM2);
  const lineToLineResistanceOhm = phaseResistanceOhm * 2;

  // Lei de Faraday para estator de fluxo axial dupla face:
  // Ke_LL [V / (rad/s)] = sqrt(3) * coilsPerPhase * (2 * N * B * L_act * R_mean) * kw
  const coilKe = 2 * input.turnsPerCoil * magneticFluxDensityT * activeRadialLengthM * meanRadiusM;
  const keLineToLine = Math.sqrt(3) * coilsPerPhase * coilKe * windingFactor;

  const kvRpmPerVolt = 60 / (2 * Math.PI * keLineToLine);
  const ktNmPerAmp = keLineToLine * 0.94; // Fator de conversão eletromecânica prática

  const rawNoLoadRpm = kvRpmPerVolt * input.supplyVoltageV;
  // Queda sob carga nominal (I * R_LL + perdas)
  const backEmfUnderLoad = Math.max(
    input.supplyVoltageV * 0.5,
    input.supplyVoltageV - input.continuousCurrentA * lineToLineResistanceOhm
  );
  const rawRatedRpm = kvRpmPerVolt * backEmfUnderLoad * 0.94;

  const rawRatedTorqueNm = ktNmPerAmp * input.continuousCurrentA;
  const maxStallCurrent = Math.min(
    input.escPeakCurrentLimitA,
    input.supplyVoltageV / Math.max(0.05, lineToLineResistanceOhm)
  );
  const rawStallTorqueNm = ktNmPerAmp * maxStallCurrent;

  // Eficiência do estágio planetário impresso 3D com rolamentos 608ZZ e graxa PTFE (~89%)
  const planetaryEfficiency = 0.89;
  const gearboxOutputRpm = rawRatedRpm / input.planetaryRatio;
  const gearboxRatedTorqueNm = rawRatedTorqueNm * input.planetaryRatio * planetaryEfficiency;
  const gearboxStallTorqueNm = rawStallTorqueNm * input.planetaryRatio * planetaryEfficiency;

  // Estágio externo M1.0 + Correia GT2 (eficiência ~90%)
  const externalEfficiency = 0.9;
  const axleRpm = gearboxOutputRpm / input.externalGearRatio;
  const axleTorqueNm = gearboxRatedTorqueNm * input.externalGearRatio * externalEfficiency;

  const wheelCircumferenceM = (Math.PI * input.wheelDiameterMm) / 1000;
  const wheelLinearSpeedMs = (axleRpm / 60) * wheelCircumferenceM;
  const wheelRadiusM = (input.wheelDiameterMm / 2) / 1000;
  const maxMotorTractiveForceN = axleTorqueNm / Math.max(0.001, wheelRadiusM);

  // Massa de cobre: densidade 8.96 g/cm³ = 8960 kg/m³
  const copperVolumeM3 = copperWireLengthM * wireAreaM2;
  const copperMassG = copperVolumeM3 * 8960 * 1000;

  // Massa estimada do conjunto motor próprio (cobre + 2 discos aço 1020 + ímãs N52 + carcaça/planetária 3D + eixo/rolamentos)
  const discsAndMagnetsMassG = 260 + input.rotorPoles * 6.5;
  const housingAndPlanetaryMassG = 210;
  const estimatedMotorMassG = Math.round(copperMassG + discsAndMagnetsMassG + housingAndPlanetaryMassG);

  // Diâmetro externo do motor axial
  const motorOuterDiameterMm = Math.round((input.statorMeanRadiusMm + 16) * 2);

  // Eficiência elétrica + mecânica global
  const copperLossW = input.continuousCurrentA * input.continuousCurrentA * lineToLineResistanceOhm;
  const mechanicalOutW = rawRatedTorqueNm * ((rawRatedRpm * 2 * Math.PI) / 60);
  const efficiencyPercent = Math.min(
    91,
    Math.max(60, Math.round((mechanicalOutW / Math.max(1, mechanicalOutW + copperLossW + 12)) * 100))
  );

  return {
    motorOuterDiameterMm,
    magneticFluxDensityT,
    windingFactor,
    copperWireLengthM: Number(copperWireLengthM.toFixed(1)),
    phaseResistanceOhm: Number(phaseResistanceOhm.toFixed(3)),
    lineToLineResistanceOhm: Number(lineToLineResistanceOhm.toFixed(3)),
    kvRpmPerVolt: Math.round(kvRpmPerVolt),
    ktNmPerAmp: Number(ktNmPerAmp.toFixed(3)),
    rawNoLoadRpm: Math.round(rawNoLoadRpm),
    rawRatedRpm: Math.round(rawRatedRpm),
    rawRatedTorqueNm: Number(rawRatedTorqueNm.toFixed(2)),
    rawStallTorqueNm: Number(rawStallTorqueNm.toFixed(2)),
    gearboxOutputRpm: Math.round(gearboxOutputRpm),
    gearboxRatedTorqueNm: Number(gearboxRatedTorqueNm.toFixed(2)),
    gearboxStallTorqueNm: Number(gearboxStallTorqueNm.toFixed(2)),
    axleRpm: Number(axleRpm.toFixed(1)),
    axleTorqueNm: Number(axleTorqueNm.toFixed(2)),
    wheelLinearSpeedMs: Number(wheelLinearSpeedMs.toFixed(2)),
    maxMotorTractiveForceN: Number(maxMotorTractiveForceN.toFixed(1)),
    copperMassG: Math.round(copperMassG),
    estimatedMotorMassG,
    efficiencyPercent,
  };
}

/**
 * Calcula indicadores quantitativos de sustentabilidade, circularidade e conformidade de massa.
 */
export function calculateSustainabilityScore(input: SustainabilityBreakdownInput): SustainabilityMetrics {
  const totalComputed =
    input.printedPartsMassG + input.reclaimedMetalMassG + input.purchasedElectronicsMassG;
  const effectiveTotal = Math.max(1, input.totalLocomotiveWeightG || totalComputed);

  // Massa circular = peças impressas em rPETG reciclado + metais reaproveitados de sucata
  const circularMassG = input.printedPartsMassG + input.reclaimedMetalMassG;
  const circularityPercent = Math.min(100, Math.round((circularMassG / effectiveTotal) * 100));

  // Economia estimada de CO2e (kg) vs. chassi usinado em alumínio virgem + chumbo + motor comercial descartável
  // Aço reaproveitado economiza ~1.9 kg CO2/kg; rPETG vs plástico virgem/alumínio ~3.2 kg CO2/kg; LiFePO4 longevidade ~2.5 kg CO2
  const co2FromSteelReuse = (input.reclaimedMetalMassG / 1000) * 1.95;
  const co2FromRpetgPrinting = (input.printedPartsMassG / 1000) * 2.4;
  const co2FromBatteryLongevity = input.usesCobaltFreeBattery ? 3.2 : 0;
  const co2SavedKg = Number((co2FromSteelReuse + co2FromRpetgPrinting + co2FromBatteryLongevity).toFixed(1));

  // Chumbo tóxico eliminado ao substituir lastro de chumbo (2900g) por sucata ferrosa/parafusos reciclados
  const toxicLeadEliminatedG = input.usesLeadBallast ? 0 : 2900;

  // Vida útil em ciclos: LiFePO4 (~2000 ciclos) vs LiPo (~300 ciclos)
  const batteryCycleLifeRatio = input.usesCobaltFreeBattery ? Number((2000 / 300).toFixed(1)) : 1.0;

  const regulationMassCompliant = effectiveTotal <= 8000;
  const massMarginG = 8000 - effectiveTotal;

  let verdictLabel = 'Sustentabilidade Padrão';
  if (circularityPercent >= 70 && !input.usesLeadBallast && input.usesCobaltFreeBattery) {
    verdictLabel = 'Excelência em Economia Circular (Sem Chumbo / Sem Cobalto)';
  } else if (circularityPercent >= 55) {
    verdictLabel = 'Alta Circularidade de Materiais';
  }

  return {
    circularityPercent,
    recycledAndPrintedPercent: circularityPercent,
    co2SavedKg,
    toxicLeadEliminatedG,
    batteryCycleLifeRatio,
    regulationMassCompliant,
    massMarginG,
    verdictLabel,
  };
}
