/**
 * Hunter Decision Engine Test
 * Version: 1.0.0
 */

import assert from "node:assert/strict";

import HunterDecisionEngine
    from "../engines/HunterDecisionEngine/HunterDecisionEngine.js";

const engine = new HunterDecisionEngine();

// ---------------------------------------------------------
// Test 1: No institutional location = PASS
// ---------------------------------------------------------

const midpointDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: false,
        nearMajorNode: false,
        reason: "Not near a major node."
    },
    pattern: {
        available: true,
        detectedPatterns: [
            { name: "REVERSE_RUG", direction: "LONG" }
        ]
    }
});

assert.equal(midpointDecision.grade, "PASS");
assert.equal(midpointDecision.direction, "NONE");

// ---------------------------------------------------------
// Test 2: Location but no confirmed pattern = WATCHLIST
// ---------------------------------------------------------

const noPatternDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: true,
        nearMajorNode: true,
        nearestNode: { strike: 100 }
    },
    pattern: {
        available: true,
        detectedPatterns: [],
        reason: "Pattern not confirmed."
    }
});

assert.equal(noPatternDecision.grade, "WATCHLIST");

// ---------------------------------------------------------
// Test 3: Rainbow Road blocks the trade
// ---------------------------------------------------------

const rainbowDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: true,
        nearMajorNode: true
    },
    pattern: {
        available: true,
        detectedPatterns: ["Rainbow Road"]
    }
});

assert.equal(rainbowDecision.grade, "PASS");

// ---------------------------------------------------------
// Test 4: Valid B trade with 2:1 execution
// ---------------------------------------------------------

const bDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: true,
        nearMajorNode: true,
        primaryNode: { strike: 100, role: "FLOOR" }
    },
    structure: {
        available: true,
        evaluation: "CHOPPY"
    },
    evolution: {
        available: true,
        hasHistory: true,
        nodeChanges: []
    },
    pattern: {
        available: true,
        detectedPatterns: [
            {
                name: "REVERSE_RUG",
                direction: "LONG",
                quality: 2
            }
        ]
    },
    relativeStrength: {
        available: false
    },
    optionsFlow: {
        available: false
    },
    darkPools: {
        available: false
    },
    execution: {
        available: true,
        data: {
            entry: 100,
            stop: 99,
            target1: 102,
            riskReward: 2,
            liquiditySufficient: true,
            nodeTaps: 1
        }
    }
});

assert.equal(bDecision.grade, "B");
assert.equal(bDecision.direction, "LONG");
assert.equal(bDecision.positionSize, "REDUCED");

// ---------------------------------------------------------
// Test 5: Fully aligned A+ trade
// ---------------------------------------------------------

const aPlusDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: true,
        nearMajorNode: true,
        primaryNode: { strike: 100, role: "FLOOR" }
    },
    structure: {
        available: true,
        evaluation: "BULLISH â RISING FLOOR"
    },
    evolution: {
        available: true,
        hasHistory: true,
        nodeChanges: [
            { event: "FLOOR ROLLING UP" },
            { event: "KING NODE MOVED UP" }
        ]
    },
    pattern: {
        available: true,
        detectedPatterns: [
            {
                name: "REVERSE_RUG",
                direction: "LONG",
                quality: 3
            }
        ]
    },
    relativeStrength: {
        available: true,
        data: { direction: "BULLISH" }
    },
    optionsFlow: {
        available: true,
        data: { direction: "BULLISH" }
    },
    darkPools: {
        available: true,
        data: { direction: "BULLISH" }
    },
    execution: {
        available: true,
        data: {
            entry: 100,
            stop: 99,
            target1: 103,
            riskReward: 3,
            liquiditySufficient: true,
            nodeTaps: 1
        }
    }
});

assert.equal(aPlusDecision.grade, "A+");
assert.equal(aPlusDecision.confidence, "HIGH");
assert.equal(aPlusDecision.positionSize, "FULL");

// ---------------------------------------------------------
// Test 6: Sub-2:1 execution = PASS
// ---------------------------------------------------------

const badRRDecision = engine.analyze({
    identity: { symbol: "TEST", spot: 100 },
    location: {
        eligible: true,
        nearMajorNode: true
    },
    structure: {
        available: true,
        evaluation: "BULLISH"
    },
    evolution: {
        available: true,
        hasHistory: true,
        nodeChanges: []
    },
    pattern: {
        available: true,
        detectedPatterns: [
            { name: "REVERSE_RUG", direction: "LONG" }
        ]
    },
    execution: {
        available: true,
        data: {
            entry: 100,
            stop: 99,
            target1: 101.5,
            riskReward: 1.5,
            liquiditySufficient: true
        }
    }
});

assert.equal(badRRDecision.grade, "PASS");

console.log("Hunter Decision Engine Test: PASS");
console.log(JSON.stringify(aPlusDecision, null, 2));