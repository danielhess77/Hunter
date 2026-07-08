/**
 * Hunter Data Connector
 * Version: 1.1
 *
 * Reads raw Skylit JSON and extracts the institutional matrix.
 */

class HunterDataConnector {

    constructor() {
        this.version = "1.1";
    }

    connect(rawData) {

        console.log("Connecting Skylit data...");

        const matrixCall = this.findMatrixCall(rawData);

        if (!matrixCall) {
            throw new Error("No Heatseeker matrix payload found.");
        }

        return matrixCall.payload;

    }

    findMatrixCall(rawData) {

        if (!rawData || !Array.isArray(rawData.fetchCalls)) {
            return null;
        }

        return rawData.fetchCalls.find(call => call.type === "matrix") || null;

    }

}

export default HunterDataConnector;