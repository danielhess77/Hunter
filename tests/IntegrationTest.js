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

const result = await hunter.analyze(rawData);

const { marketState, nodes, structure } = result;

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