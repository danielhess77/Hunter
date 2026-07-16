/**
 * Hunter Evidence Test
 *
 * Validates the canonical evidence contract independently
 * of the future Decision Engine.
 */

import fs from "fs";
import path from "path";
import assert from "node:assert/strict";

import HunterRuntime from "../runtime/HunterRuntime.js";

const jsonPath = path.resolve(
    "tests/Fixtures/SPY_Heatseeker_2026-07-07.json"
);

const rawData = JSON.parse(
    fs.readFileSync(jsonPath, "utf8")
);

const hunter = new HunterRuntime();

// First run seeds Hunter Memory.
await hunter.analyze(rawData);

// Second run supplies evolution history.
const result = await hunter.analyze(rawData);
const evidence = result.evidence;

assert.ok(evidence, "Evidence snapshot should exist.");
assert.equal(evidence.version, "0.1.0");
assert.equal(evidence.identity.symbol, result.marketState.symbol);
assert.equal(evidence.structure.available, true);
assert.equal(evidence.pattern.available, true);
assert.equal(evidence.evolution.available, true);
assert.equal(evidence.evolution.hasHistory, true);
assert.equal(evidence.relativeStrength.available, false);
assert.equal(evidence.optionsFlow.available, false);
assert.equal(evidence.darkPools.available, false);
assert.equal(evidence.execution.available, false);
assert.ok(Array.isArray(evidence.completeness.missing));
assert.ok(evidence.sources.structure === result.structure);

console.log("Hunter Evidence Test: PASS");
console.log(JSON.stringify(evidence.toJSON(), null, 2));