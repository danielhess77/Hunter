/**
 * Hunter Data Connector
 * Version: 1.0
 *
 * Reads raw Skylit JSON and converts it into
 * Hunter's internal MarketState object.
 */

class HunterDataConnector {

    constructor() {
        this.version = "1.0";
    }

    connect(rawData) {

        console.log("Connecting Skylit data...");

        return rawData;

    }

}

export default HunterDataConnector;