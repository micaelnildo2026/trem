export interface MotorOption {
  id: string;
  name: string;
  type: 'dc_planetary' | 'dc_worm' | 'brushless_gear' | 'stepper' | 'diy_axial_planetary' | 'screwdriver_chain';
  voltage: number; // V
  noLoadRpm: number;
  ratedRpm: number;
  ratedTorque: number; // N.m
  stallTorque: number; // N.m
  ratedCurrent: number; // A
  stallCurrent: number; // A
  weight: number; // g
  efficiency: number; // %
  recommended: boolean;
  scoreHelpers: number; // 0-10
  scoreElevation: number; // 0-10
  scoreAcceleration: number; // 0-10
  scoreTugOfWar: number; // 0-10
  pros: string[];
  cons: string[];
  verdict: string;
}

export type ProductionMethod = 'print3d' | 'fabrication' | 'purchase';

export interface SustainableBomItem {
  id: string;
  subsystem: 'motor' | 'transmission' | 'chassis' | 'electronics';
  name: string;
  method: ProductionMethod;
  materialOrSpec: string;
  sustainabilityRole: string;
  massG: number;
  estimatedCostBrl: number;
  tooling: string;
}

export interface FabricationStep {
  stepNumber: number;
  title: string;
  methodBadge: string;
  durationEst: string;
  summary: string;
  details: string[];
  qualityCheck: string;
}

export interface TransmissionConfig {
  motorRpm: number;
  motorPinionTeeth: number; // Z1 (e.g. 15)
  drivenGearTeeth: number; // Z2 (e.g. 45) -> Ratio 3:1
  internalGearboxRatio: number; // e.g. 19.2:1
  pulleyWheelAxle1Teeth: number; // Z3 (e.g. 30T GT2)
  pulleyWheelAxle2Teeth: number; // Z4 (e.g. 30T GT2) -> 1:1
  wheelbaseMm: number; // Distance between axle 1 and axle 2 (e.g. 160 mm)
  wheelDiameterMm: number; // e.g. 65 mm
  beltPitchMm: number; // 2mm for GT2
  beltWidthMm: number; // 9mm or 10mm
}

export interface LocomotiveSpecs {
  gaugeMm: number; // Bitola: 150 mm (Regulamento)
  hitchHeightMm: number; // Altura engate: 105 - 110 mm (107.5 mm)
  totalLengthMm: number; // Max 360 mm (335 mm)
  totalWidthMm: number; // Max 220 mm (205 mm)
  totalHeightMm: number; // Max 330 mm (245 mm)
  totalWeightGrams: number; // Max 8000 g (e.g. 7650 g)
  chassisWeightG: number;
  shellWeightG: number;
  motorGearboxWeightG: number;
  batteryWeightG: number;
  wheelsetBearingsWeightG: number;
  ballastWeightG: number;
  wheelFrictionCoeff: number; // 0.65 with PU O-ring on steel rail
}

export interface CompetitionTestResults {
  helpers: {
    maxLoadPushedKg: number;
    forceRequiredN: number;
    motorCurrentA: number;
    speedMs: number;
    status: 'passed' | 'warning' | 'failed';
  };
  elevation: {
    maxAngleDeg: number;
    tractionForceN: number;
    wheelSlipRisk: boolean;
    climbSpeedMs: number;
    status: 'passed' | 'warning' | 'failed';
  };
  acceleration: {
    time2500MmS: number;
    topSpeedMs: number;
    initialAccMs2: number;
    status: 'passed' | 'warning' | 'failed';
  };
  tugOfWar: {
    drawbarPullForceN: number;
    adhesionLimitN: number;
    hitchSafetyFactor: number;
    status: 'passed' | 'warning' | 'failed';
  };
}
