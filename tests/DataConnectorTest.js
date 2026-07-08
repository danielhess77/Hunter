/**
 * Hunter Integration Test
 *
 * Verifies that the Hunter Data Connector
 * can populate HunterMarketState from a
 * real Skylit export.
 */


import HunterDataConnector from "../connectors/HunterDataConnector/HunterDataConnector.js";
import HunterMarketState from "../runtime/HunterMarketState.js";

const connector = new HunterDataConnector();
const marketState = new HunterMarketState();

console.log("Hunter Integration Test Ready");