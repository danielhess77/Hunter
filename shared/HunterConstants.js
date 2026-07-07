/**
 * Hunter Constants
 * Version: 1.0
 *
 * Core rule thresholds used across Hunter.
 */

export const HunterConstants = Object.freeze({
    NEAR_NODE_STRIKES: 2,

    NODE_BUILDING_THRESHOLD: 0.20,
    NODE_STABLE_THRESHOLD: 0.10,
    NODE_WEAKENING_THRESHOLD: -0.20,

    LOCATION_SCORE_MAX: 30,
    PATTERN_SCORE_MAX: 30,
    RELATIVE_STRENGTH_SCORE_MAX: 15
});