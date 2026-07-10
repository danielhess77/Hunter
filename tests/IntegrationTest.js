/**
 * Hunter Integration Test
 *
 * End-to-end test using HunterRuntime.
 */

import fs from "fs";
import path from "path";

import HunterRuntime from "../runtime/HunterRuntime.js";

const jsonPath = path.resolve(
    "tests/Fixtures/SPY_Heatseeker_2026-07-07.json"
);

const rawData = JSON.parse(
    fs.readFileSync(jsonPath, "utf8")
);

// ----------------------------------------
// Run Hunter
// ----------------------------------------

const hunter = new HunterRuntime();

// First snapshot
await hunter.analyze(rawData);

// Controlled second snapshot near King Gamma
const eligibleRawData = structuredClone(rawData);

const matrixCall =
    eligibleRawData.fetchCalls.find(
        call => call.type === "matrix"
    );

matrixCall.payload.CurrentSpot = 740.5;

const result = await hunter.analyze(eligibleRawData);

const { marketState, nodes, structure } = result;

console.log("");
console.log("=========================");
console.log("STRUCTURE DEBUG");
console.log("=========================");

console.log("King Gamma =", structure.kingGammaNode);
console.log("Strongest Above =", structure.strongestNodeAboveSpot);
console.log("Strongest Below =", structure.strongestNodeBelowSpot);
console.log("Nearest =", structure.nearestNode);

console.log("");

// ----------------------------------------
// Report
// ----------------------------------------

console.log("===========================");
console.log("HUNTER REPORT");
console.log("===========================");

console.log("Symbol:", marketState.symbol);
console.log("Spot:", marketState.spot);

console.log("");

console.log("Nodes Parsed:", nodes.length);

console.log("");

console.log("King Gamma:",
    structure.kingNode?.strike ?? "None");

console.log("King Gamma Magnitude:",
    structure.kingNode?.gammaMagnitude?.toFixed(0) ?? "None");

console.log("");

console.log("Strongest Above:",
    structure.strongestNodeAboveSpot?.strike ?? "None");

console.log("Gamma:",
    structure.strongestNodeAboveSpot?.gammaMagnitude?.toFixed(0) ?? "None");

console.log("");

console.log("Strongest Below:",
    structure.strongestNodeBelowSpot?.strike ?? "None");

console.log("Gamma:",
    structure.strongestNodeBelowSpot?.gammaMagnitude?.toFixed(0) ?? "None");

console.log("");

console.log("Nearest:",
    structure.nearestNode?.strike ?? "None");

console.log("Distance:",
    structure.nearestDistance?.toFixed(3));

console.log("");

console.log("Nearby Nodes:",
    structure.nearbyNodes.length);

console.log("");

console.log("Top 5 Gamma Nodes");

structure.nodes
    .sort((a, b) => b.gammaMagnitude - a.gammaMagnitude)
    .slice(0, 5)
    .forEach((node, index) => {

        console.log(
            `${index + 1}. ${node.strike}  (${node.gammaMagnitude.toFixed(0)})`
        );

    });

console.log("===========================");

console.log("Nearby Nodes:",
    result.structure.nearbyNodes.length);

console.log("");
console.log("===========================");
console.log("DECISION");
console.log("===========================");

console.log("Grade:",
    result.decision.grade);

console.log("Score:",
    result.decision.score);

console.log("");

console.log("Reasons:");

result.decision.reasons.forEach(reason => {

    console.log("•", reason);

});

console.log("");
console.log("===========================");
console.log("PATTERN ENGINE");
console.log("===========================");

console.log("Status:",
    result.patterns.status);

console.log("Location Eligible:",
    result.patterns.locationEligible);

console.log("");

if (result.patterns.primaryNode) {

    console.log("Primary Node:",
        result.patterns.primaryNode.role);

    console.log("Strike:",
        result.patterns.primaryNode.strike);

    console.log("");

}

console.log("Candidate Patterns:");

result.patterns.candidatePatterns.forEach(pattern => {

    console.log("-", pattern.name);

    if (pattern.stage) {
        console.log("  Stage:", pattern.stage);
    }

    if (pattern.direction) {
        console.log("  Direction:", pattern.direction);
    }

    if (pattern.strike !== undefined) {
        console.log("  Strike:", pattern.strike);
    }

    if (pattern.nodeRole) {
        console.log("  Node:", pattern.nodeRole);
    }

    if (pattern.distanceFromSpot !== undefined) {
        console.log(
            "  Distance:",
            pattern.distanceFromSpot.toFixed(2)
        );
    }

    if (pattern.confidence !== undefined) {
        console.log(
            "  Confidence:",
            pattern.confidence + "%"
        );
    }

    if (pattern.reason) {
        console.log("  Reason:", pattern.reason);
    }

    console.log("");

});

console.log("");
console.log("==========================");
console.log("MEMORY");
console.log("==========================");

console.log(
    "Has Previous Snapshot:",
    result.memory.hasHistory()
);

if (result.memory.hasHistory()) {

    console.log("");

    console.log(
        "Previous Spot:",
        result.memory.getPrevious().spot
    );

    console.log(
        "Current Spot:",
        result.memory.getCurrent().spot
    );

}