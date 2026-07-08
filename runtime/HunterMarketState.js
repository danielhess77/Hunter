/**
 * Hunter Market State
 * Version: 1.1
 *
 * Stores the current institutional market snapshot.
 */

class HunterMarketState {

    constructor() {

        this.symbol = null;

        this.spot = null;

        this.expirations = [];

        this.strikes = [];

        this.gamma = [];

        this.vanna = [];

        this.lastUpdated = null;

    }

    loadMatrix(matrix) {

        this.symbol = matrix.symbol;

        this.spot = matrix.CurrentSpot;

        this.expirations = matrix.Expirations || [];

        this.strikes = matrix.Strikes || [];

        this.gamma = matrix.GammaValues || [];

        this.vanna = matrix.VannaValues || [];

        this.lastUpdated = matrix.LastUpdated || null;

    }

}

export default HunterMarketState;