import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CUSTOM_MOTOR_INPUT,
  calculateCustomMotorSpecs,
  calculateSustainabilityScore,
} from './sustainableMotorPhysics';

test('calculates valid electromagnetic and kinematic specs for default 12N14P DIY motor', () => {
  const result = calculateCustomMotorSpecs(DEFAULT_CUSTOM_MOTOR_INPUT);

  assert.equal(result.windingFactor, 0.933);
  assert.ok(result.motorOuterDiameterMm <= 120, 'Motor must easily fit inside 205 mm loco chassis');
  assert.ok(result.kvRpmPerVolt > 80 && result.kvRpmPerVolt < 250, `Expected reasonable Kv, got ${result.kvRpmPerVolt}`);
  assert.ok(result.gearboxOutputRpm >= 200 && result.gearboxOutputRpm <= 450, `Expected gearbox RPM around 250-400, got ${result.gearboxOutputRpm}`);
  assert.ok(result.gearboxRatedTorqueNm >= 3.5, `Expected rated torque >= 3.5 N.m, got ${result.gearboxRatedTorqueNm}`);
  assert.ok(result.gearboxStallTorqueNm >= 10.0, `Expected stall torque >= 10 N.m, got ${result.gearboxStallTorqueNm}`);
  assert.ok(result.maxMotorTractiveForceN > 250, 'Tractive force must exceed 250 N');
  assert.ok(result.estimatedMotorMassG > 400 && result.estimatedMotorMassG < 1100);
});

test('increasing turns per coil lowers Kv and increases Kt and torque at same current', () => {
  const lowTurns = calculateCustomMotorSpecs({
    ...DEFAULT_CUSTOM_MOTOR_INPUT,
    turnsPerCoil: 16,
  });
  const highTurns = calculateCustomMotorSpecs({
    ...DEFAULT_CUSTOM_MOTOR_INPUT,
    turnsPerCoil: 30,
  });

  assert.ok(highTurns.kvRpmPerVolt < lowTurns.kvRpmPerVolt);
  assert.ok(highTurns.ktNmPerAmp > lowTurns.ktNmPerAmp);
  assert.ok(highTurns.rawRatedTorqueNm > lowTurns.rawRatedTorqueNm);
  assert.ok(highTurns.copperWireLengthM > lowTurns.copperWireLengthM);
});

test('sustainability score verifies circularity, zero toxic lead, and regulation weight cap', () => {
  const metrics = calculateSustainabilityScore({
    totalLocomotiveWeightG: 7650,
    printedPartsMassG: 2610, // chassi rPETG + carenagem PLA + carcaça/planetária motor
    reclaimedMetalMassG: 3650, // sucata aço lastro 2900g + discos rotor + eixos reaproveitados
    purchasedElectronicsMassG: 1390, // cobre + N52 + rolamentos + LiFePO4 + ESC
    usesLeadBallast: false,
    usesCobaltFreeBattery: true,
  });

  assert.equal(metrics.regulationMassCompliant, true);
  assert.equal(metrics.massMarginG, 350);
  assert.equal(metrics.toxicLeadEliminatedG, 2900);
  assert.ok(metrics.circularityPercent >= 75, `Expected high circularity, got ${metrics.circularityPercent}%`);
  assert.ok(metrics.co2SavedKg > 10);
  assert.ok(metrics.batteryCycleLifeRatio > 5);
});
