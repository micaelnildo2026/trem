export type CompetitionProofId = 'helpers' | 'elevation' | 'acceleration' | 'tug_of_war';

export interface HelpersFrameInput {
  elapsedS: number;
  targetSpeedMs: number;
  totalDurationS: number;
  passed: boolean;
}

export interface ElevationFrameInput {
  elapsedS: number;
  targetSpeedMs: number;
  totalDurationS: number;
  passed: boolean;
}

export interface AccelerationFrameInput {
  elapsedS: number;
  accMs2: number;
  topSpeedMs: number;
  totalDurationS: number;
}

export interface TugOfWarFrameInput {
  elapsedS: number;
  ourForceN: number;
  rivalForceN: number;
  totalMassKg: number;
  totalDurationS: number;
}

export interface TrialFrameState {
  progress: number; // 0..1 normalized progress along track or tug displacement
  distanceM: number; // current longitudinal distance in meters (can be signed in tug_of_war)
  instantSpeedMs: number;
  wheelAngleDeg: number; // rotation angle of drive wheels
  isSlipping: boolean;
  isFinished: boolean;
  pwmPercent: number;
}

const WHEEL_CIRCUMFERENCE_M = Math.PI * 0.065; // 65 mm wheel diameter

function toWheelDeg(distanceM: number, extraSlipDeg = 0): number {
  return ((distanceM / WHEEL_CIRCUMFERENCE_M) * 360 + extraSlipDeg) % 360;
}

/**
 * Pure deterministic frame evaluation for Prova 4.2 (Helpers 2.0 m push test).
 */
export function evaluateHelpersFrame(input: HelpersFrameInput): TrialFrameState {
  const t = Math.max(0, input.elapsedS);
  const duration = Math.max(0.5, input.totalDurationS);

  if (!input.passed) {
    // Locomotive stalls/slips near 0.28 m while spinning wheels faster than ground advance
    const stalledT = Math.min(t, duration);
    const crawlDistance = Math.min(0.32, stalledT * 0.14);
    const isFinished = t >= duration;
    const slipSpin = stalledT * 520;
    return {
      progress: Math.min(1, crawlDistance / 2.0),
      distanceM: Number(crawlDistance.toFixed(3)),
      instantSpeedMs: t >= duration ? 0 : 0.06,
      wheelAngleDeg: toWheelDeg(crawlDistance, slipSpin),
      isSlipping: true,
      isFinished,
      pwmPercent: isFinished ? 0 : 95,
    };
  }

  const rampS = 0.4;
  const clampedT = Math.min(t, duration);
  let distanceM = 0;
  let instantSpeedMs = 0;

  if (clampedT <= rampS) {
    const accel = input.targetSpeedMs / rampS;
    distanceM = 0.5 * accel * clampedT * clampedT;
    instantSpeedMs = accel * clampedT;
  } else {
    const distRamp = 0.5 * input.targetSpeedMs * rampS;
    const cruiseFrac = Math.min(1, (clampedT - rampS) / Math.max(0.1, duration - rampS));
    const distRem = 2.0 - distRamp;
    distanceM = distRamp + distRem * cruiseFrac;
    instantSpeedMs = clampedT >= duration ? 0 : input.targetSpeedMs;
  }

  const boundedDist = Math.min(2.0, distanceM);
  const isFinished = t >= duration;

  return {
    progress: boundedDist / 2.0,
    distanceM: Number(boundedDist.toFixed(3)),
    instantSpeedMs: Number((isFinished ? 0 : instantSpeedMs).toFixed(2)),
    wheelAngleDeg: toWheelDeg(boundedDist),
    isSlipping: false,
    isFinished,
    pwmPercent: isFinished ? 0 : clampedT < rampS ? Math.round((clampedT / rampS) * 85) : 85,
  };
}

/**
 * Pure deterministic frame evaluation for Prova 4.3 (Elevation ramp 2.0 m).
 */
export function evaluateElevationFrame(input: ElevationFrameInput): TrialFrameState {
  const t = Math.max(0, input.elapsedS);
  const duration = Math.max(0.5, input.totalDurationS);

  if (!input.passed) {
    // Climbs briefly up to ~0.45 m then loses traction and slips
    const slipT = Math.min(t, duration);
    const partialDist = slipT < 1.0 ? slipT * 0.42 : Math.max(0.18, 0.42 - (slipT - 1.0) * 0.08);
    const isFinished = t >= duration;
    return {
      progress: Math.min(1, partialDist / 2.0),
      distanceM: Number(partialDist.toFixed(3)),
      instantSpeedMs: isFinished ? 0 : 0.05,
      wheelAngleDeg: toWheelDeg(partialDist, slipT * 620),
      isSlipping: true,
      isFinished,
      pwmPercent: isFinished ? 0 : 100,
    };
  }

  const clampedT = Math.min(t, duration);
  const norm = clampedT / duration;
  // Slight S-curve launch smoothing for realistic ramp climb
  const eased = norm < 0.15 ? (norm * norm) / (2 * 0.15) : (norm - 0.075) / 0.925;
  const boundedNorm = Math.min(1, Math.max(0, eased));
  const distanceM = 2.0 * boundedNorm;
  const isFinished = t >= duration;

  return {
    progress: boundedNorm,
    distanceM: Number(distanceM.toFixed(3)),
    instantSpeedMs: Number((isFinished ? 0 : input.targetSpeedMs).toFixed(2)),
    wheelAngleDeg: toWheelDeg(distanceM),
    isSlipping: false,
    isFinished,
    pwmPercent: isFinished ? 0 : 92,
  };
}

/**
 * Pure deterministic frame evaluation for Prova 4.4 (2500 mm / 2.5 m acceleration sprint).
 */
export function evaluateAccelerationFrame(input: AccelerationFrameInput): TrialFrameState {
  const t = Math.max(0, input.elapsedS);
  const duration = Math.max(0.4, input.totalDurationS);
  const a = Math.max(0.2, input.accMs2);
  const vMax = Math.max(0.2, input.topSpeedMs);

  const t1 = vMax / a;
  const d1 = 0.5 * a * t1 * t1;
  const clampedT = Math.min(t, duration);

  let distanceM = 0;
  let instantSpeedMs = 0;

  if (clampedT <= t1 && d1 <= 2.5) {
    distanceM = 0.5 * a * clampedT * clampedT;
    instantSpeedMs = a * clampedT;
  } else if (d1 >= 2.5) {
    distanceM = Math.min(2.5, 0.5 * a * clampedT * clampedT);
    instantSpeedMs = Math.min(vMax, a * clampedT);
  } else {
    const dt = clampedT - t1;
    const remTime = Math.max(0.05, duration - t1);
    const remDist = 2.5 - d1;
    distanceM = d1 + (remDist * dt) / remTime;
    instantSpeedMs = vMax;
  }

  const boundedDist = Math.min(2.5, distanceM);
  const isFinished = t >= duration;
  const pwmRampS = 0.3;
  const pwm = isFinished ? 0 : clampedT < pwmRampS ? Math.round(30 + (clampedT / pwmRampS) * 70) : 100;

  return {
    progress: boundedDist / 2.5,
    distanceM: Number(boundedDist.toFixed(3)),
    instantSpeedMs: Number((isFinished ? 0 : instantSpeedMs).toFixed(2)),
    wheelAngleDeg: toWheelDeg(boundedDist),
    isSlipping: false,
    isFinished,
    pwmPercent: pwm,
  };
}

/**
 * Pure deterministic frame evaluation for Prova 4.5 (Cabo de Guerra / 1.2 m pull).
 * Negative distanceM means our team pulls the rival toward our side (victory!).
 * Positive distanceM means rival pulls us toward their side.
 */
export function evaluateTugOfWarFrame(input: TugOfWarFrameInput): TrialFrameState {
  const t = Math.max(0, input.elapsedS);
  const duration = Math.max(1.0, input.totalDurationS);
  const tensionPhaseS = 0.45;
  const netForce = input.ourForceN - input.rivalForceN; // > 0 means we win

  if (Math.abs(netForce) < 0.8) {
    // Tight deadlock with slight micro-oscillation around center
    const oscillation = t < duration ? Math.sin(t * 14) * 0.04 : 0;
    return {
      progress: 0,
      distanceM: Number(oscillation.toFixed(3)),
      instantSpeedMs: 0,
      wheelAngleDeg: toWheelDeg(Math.abs(oscillation), t < duration ? t * 180 : 0),
      isSlipping: t < duration,
      isFinished: t >= duration,
      pwmPercent: t >= duration ? 0 : 100,
    };
  }

  const clampedT = Math.min(t, duration);
  if (clampedT <= tensionPhaseS) {
    return {
      progress: 0,
      distanceM: 0,
      instantSpeedMs: 0,
      wheelAngleDeg: (clampedT * 90) % 360,
      isSlipping: false,
      isFinished: false,
      pwmPercent: Math.round((clampedT / tensionPhaseS) * 100),
    };
  }

  const moveFrac = Math.min(1, (clampedT - tensionPhaseS) / (duration - tensionPhaseS));
  // Smooth acceleration pull up to 1.20 m victory mark
  const easedPull = moveFrac * moveFrac * (3 - 2 * moveFrac);
  const sign = netForce > 0 ? -1 : 1; // negative = toward UFSC victory flag on left
  const distanceM = sign * 1.2 * easedPull;
  const dragSpeed = (Math.abs(netForce) / Math.max(5, input.totalMassKg)) * 0.18 * (1 - 0.3 * moveFrac);
  const isFinished = t >= duration;

  return {
    progress: easedPull,
    distanceM: Number(distanceM.toFixed(3)),
    instantSpeedMs: Number((isFinished ? 0 : dragSpeed).toFixed(2)),
    wheelAngleDeg: toWheelDeg(Math.abs(distanceM), sign < 0 ? 0 : clampedT * 420),
    isSlipping: sign > 0, // if we are being dragged, our wheels are losing traction
    isFinished,
    pwmPercent: isFinished ? 0 : 100,
  };
}
