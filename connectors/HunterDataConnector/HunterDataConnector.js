/**
 * Hunter Data Connector
 * Version: 1.1
 *
 * Reads raw Skylit JSON and converts it into
 * Hunter's internal MarketState object.
 */

class HunterDataConnector {

    constructor() {
        this.version = "1.1";
    }

    connect(rawData, marketState) {

    console.log("Connecting Skylit data...");

    const matrixCall = this.findMatrixCall(rawData);

    if (!matrixCall) {
        throw new Error("No Heatseeker matrix payload found.");
    }

    marketState.loadMatrix(matrixCall.payload);

    return marketState;
}

    findMatrixCall(rawData) {

    if (!rawData.fetchCalls) {
        return null;
    }

    return rawData.fetchCalls.find(call =>
        call.type === "matrix" &&
        call.payload
    );

}

}
export default HunterDataConnector;