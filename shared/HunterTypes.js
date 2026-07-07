/**
 * Hunter Types
 * Version: 1.0
 *
 * Shared definitions used by every Hunter engine.
 */

// Node Types
export const NodeType = Object.freeze({
    KING: "King",
    FLOOR: "Floor",
    CEILING: "Ceiling",
    GATEKEEPER: "Gatekeeper"
});

// Node States
export const NodeState = Object.freeze({
    BUILDING: "Building",
    STABLE: "Stable",
    WEAKENING: "Weakening",
    BROKEN: "Broken"
});

// Migration
export const Migration = Object.freeze({
    UP: "Up",
    DOWN: "Down",
    NONE: "None"
});

// Market Structure
export const MarketStructure = Object.freeze({
    BULLISH: "Bullish",
    BEARISH: "Bearish",
    PINNED: "Pinned",
    CHOPPY: "Choppy",
    TRANSITION: "Transition"
});

// Relative Strength
export const RelativeStrength = Object.freeze({
    EXCEPTIONAL: "Exceptional",
    GOOD: "Good",
    NEUTRAL: "Neutral",
    WEAK: "Weak"
});