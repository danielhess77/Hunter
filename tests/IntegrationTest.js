/**
 * Hunter Integration Test
 *
 * End-to-end test of Hunter's
 * institutional pipeline.
 */

import fs from "fs";

import HunterMarketState from "../runtime/HunterMarketState.js";
import HunterDataConnector from "../connectors/HunterDataConnector/HunterDataConnector.js";
import InstitutionalMapEngine from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";
import InstitutionalStructureEngine from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";
import path from "path";

const jsonPath = path.resolve(
    "tests/Fixtures/SPY_Heatseeker_2026-07-07.json"
);

const rawData = JSON.parse(
    fs.readFileSync(jsonPath, "utf8")
);

const marketState = new HunterMarketState();

const connector = new HunterDataConnector();

const mapEngine = new InstitutionalMapEngine();

const structureEngine = new InstitutionalStructureEngine();

connector.connect(rawData, marketState);

const nodes = mapEngine.analyze(marketState);
    console.log("FIRST NODE:");
    console.log(nodes[0]);

    console.log("TOP FIVE:");
    console.log(nodes.slice(0,5));

const structure = structureEngine.analyze(
    nodes,
    marketState.spot
);

console.log("===========================");
console.log("HUNTER REPORT");
console.log("===========================");

console.log("Symbol:", marketState.symbol);
console.log("Spot:", marketState.spot);

console.log("");

console.log("King Gamma:", structure.kingNode?.strike);

console.log("King Gamma Magnitude:",
    structure.kingNode?.gammaMagnitude);

console.log("");

console.log("Strongest Above:",
    structure.strongestNodeAboveSpot?.strike);

console.log("Gamma:",
    structure.strongestNodeAboveSpot?.gammaMagnitude);

console.log("");

console.log("Strongest Below:",
    structure.strongestNodeBelowSpot?.strike);

console.log("Gamma:",
    structure.strongestNodeBelowSpot?.gammaMagnitude);

console.log("");

console.log("Nearest:",
    structure.nearestNode?.strike);

console.log("Distance:",
    structure.nearestDistance);

console.log("");

console.log("Nearby Nodes:",
    structure.nearbyNodes.length);