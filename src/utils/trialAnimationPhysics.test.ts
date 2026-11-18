import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHelpersFrame,
  evaluateElevationFrame,
  evaluateAccelerationFrame,
  evaluateTugOfWarFrame,
} from './trialAnimationPhysics';

test('helpers frame advances smoothly from 0 to 2.0m when passed and stalls when overloaded', () => {
  const start = evaluateHelpersFrame({
    elapsedS: 0,
    targetSpeedMs: 0.85,
    totalDurationS: 2.65,
    passed: true,
  });
  assert.equal(start.distanceM, 0);
  assert.equal(start.isFinished, false);

  const end = evaluateHelpersFrame({
    elapsedS: 3.0,
    targetSpeedMs: 0.85,
    totalDurationS: 2.65,
    passed: true,
  });
  assert.equal(end.distanceM, 2.0);
  assert.equal(end.progress, 1);
  assert.equal(end.isFinished, true);

  const slipped = evaluateHelpersFrame({
    elapsedS: 1.5,
    targetSpeedMs: 0.85,
    totalDurationS: 2.65,
    passed: false,
  });
  assert.equal(slipped.isSlipping, true);
  assert.ok(slipped.distanceM < 0.5);
});

test('elevation frame completes 2.0m climb when traction holds and slips above adhesion limit', () => {
  const endPass = evaluateElevationFrame({
    elapsedS: 2.8,
    targetSpeedMs: 0.78,
    totalDurationS: 2.56,
    passed: true,
  });
  assert.equal(endPass.distanceM, 2.0);
  assert.equal(endPass.isSlipping, false);
  assert.equal(endPass.isFinished, true);

  const midSlip = evaluateElevationFrame({
    elapsedS: 1.4,
    targetSpeedMs: 0.4,
    totalDurationS: 5.0,
    passed: false,
  });
  assert.equal(midSlip.isSlipping, true);
  assert.ok(midSlip.distanceM < 0.6);
});

test('acceleration frame respects 2500mm sprint distance and ramps speed before cruising', () => {
  const launch = evaluateAccelerationFrame({
    elapsedS: 0.25,
    accMs2: 2.5,
    topSpeedMs: 1.05,
    totalDurationS: 2.59,
  });
  assert.ok(launch.distanceM > 0 && launch.distanceM < 0.2);
  assert.ok(launch.instantSpeedMs > 0.5 && launch.instantSpeedMs < 1.05);

  const finish = evaluateAccelerationFrame({
    elapsedS: 3.0,
    accMs2: 2.5,
    topSpeedMs: 1.05,
    totalDurationS: 2.59,
  });
  assert.equal(finish.distanceM, 2.5);
  assert.equal(finish.progress, 1);
  assert.equal(finish.isFinished, true);
});

test('tug of war frame pulls rival to -1.2m when our force dominates', () => {
  const tension = evaluateTugOfWarFrame({
    elapsedS: 0.2,
    ourForceN: 48.8,
    rivalForceN: 22.3,
    totalMassKg: 14.15,
    totalDurationS: 2.8,
  });
  assert.equal(tension.distanceM, 0);
  assert.equal(tension.isFinished, false);

  const victory = evaluateTugOfWarFrame({
    elapsedS: 3.0,
    ourForceN: 48.8,
    rivalForceN: 22.3,
    totalMassKg: 14.15,
    totalDurationS: 2.8,
  });
  assert.equal(victory.distanceM, -1.2);
  assert.equal(victory.progress, 1);
  assert.equal(victory.isFinished, true);
  assert.equal(victory.isSlipping, false);
});
