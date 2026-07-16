import HunterDataConnector from "../connectors/HunterDataConnector.js";
import HunterMarketState from "../runtime/HunterMarketState.js";

const connector = new HunterDataConnector();
const marketState = new HunterMarketState();

const normalized = connector.connect(rawData, marketState);

console.log("================================");
console.log("Hunter Connector Integration");
console.log("================================");

console.log("Version:", marketState.version);
console.log("Valid:", marketState.valid);
console.log("Reason:", marketState.reason);

console.log("");

console.log("Symbol:", marketState.symbol);
console.log("Spot:", marketState.currentSpot);

console.log("");

console.log("Strike Count:", marketState.strikes.length);
console.log("Expiration Count:", marketState.expirations.length);

console.log("");

console.log("Gamma Rows:", marketState.gammaMatrix.length);
console.log("Vanna Rows:", marketState.vannaMatrix.length);

console.log("");

console.log("Node Count:", marketState.nodes.length);

console.log("");

console.log("Options Flow:", marketState.optionsFlow.length);
console.log("Dark Pools:", marketState.darkPools.length);

console.log("");

console.log(
    "Metadata:",
    marketState.metadata
);