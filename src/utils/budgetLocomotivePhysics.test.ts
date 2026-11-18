import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetSummary,
  calculateScrewdriverChainDrivetrain,
  evaluateBudgetFourTrials,
  BudgetLocomotiveItem,
} from './budgetLocomotivePhysics';
import { BUDGET_200_CORE_ITEMS_OUTLET, BUDGET_200_RC_OPTIONS } from '../data/locomotiveData';

test('bicycle chain drivetrain ensures safe rail clearance and competition speed', () => {
  const out = calculateScrewdriverChainDrivetrain({
    screwdriverRpm: 290,
    screwdriverRatedTorqueNm: 4.6,
    screwdriverStallTorqueNm: 14.5,
    motorSprocketTeeth: 14,
    axleSprocketTeeth: 16,
    wheelDiameterMm: 84,
    locoMassKg: 7.65,
    frictionCoeff: 0.68,
  });

  assert.equal(out.chainPitchMm, 12.7);
  assert.equal(out.clearanceOk, true);
  assert.ok(out.railClearanceMm >= 6.0, `Expected >= 6mm rail clearance, got ${out.railClearanceMm}`);
  assert.ok(out.wheelLinearSpeedMs >= 0.9 && out.wheelLinearSpeedMs <= 1.3);
  assert.ok(out.motorTractiveForceN > out.adhesionLimitN);
});

test('budget audit keeps core traction/power under R$ 200 cap while separating RC system and zero-cost ballast', () => {
  const sampleItems: BudgetLocomotiveItem[] = [
    ...BUDGET_200_CORE_ITEMS_OUTLET,
    ...BUDGET_200_RC_OPTIONS[0].items,
  ];

  const audit = calculateBudgetSummary(sampleItems, 200);
  assert.equal(audit.coreTotalBrl, 196);
  assert.equal(audit.withinBudgetCap, true);
  assert.equal(audit.remainingMarginBrl, 4);
  assert.equal(audit.remoteControlTotalBrl, 95);
  assert.equal(audit.grandTotalWithRcBrl, 291);
  assert.equal(audit.free3dMassG, 1900);
  assert.equal(audit.ballastMassG, 3870);
  assert.ok(audit.totalEstimatedMassG <= 8000, `Expected <= 8000g, got ${audit.totalEstimatedMassG}`);
});

test('chosen RS-550 1:36 motor + 20A 3S battery passes all 4 official competition trials and regulation', () => {
  const drivetrain = calculateScrewdriverChainDrivetrain({
    screwdriverRpm: 290,
    screwdriverRatedTorqueNm: 4.6,
    screwdriverStallTorqueNm: 14.5,
    motorSprocketTeeth: 14,
    axleSprocketTeeth: 16,
    wheelDiameterMm: 84,
    locoMassKg: 7.65,
    frictionCoeff: 0.68,
  });

  const combinedItems: BudgetLocomotiveItem[] = [
    ...BUDGET_200_CORE_ITEMS_OUTLET,
    ...BUDGET_200_RC_OPTIONS[0].items,
  ];
  const audit = calculateBudgetSummary(combinedItems, 200);

  const evaluation = evaluateBudgetFourTrials({
    drivetrain,
    locoMassKg: 7.65,
    frictionCoeff: 0.68,
    batteryMaxContinuousA: 20,
    totalEstimatedMassG: audit.totalEstimatedMassG,
    wheelDiameterMm: 84,
  });

  assert.equal(evaluation.allTrialsPassed, true);
  assert.equal(evaluation.totalWeightOk, true);
  assert.equal(evaluation.trials.length, 4);
  assert.ok(evaluation.regulationSummary.every((r) => r.compliant));
});
