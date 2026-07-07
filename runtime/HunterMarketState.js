/**
 * Hunter Market State
 * Version: 1.1
 *
 * Central store for all normalized market data.
 */

class HunterMarketState {

    constructor() {

        this.symbol = null;
        this.price = null;
        this.timestamp = null;

        this.nodes = [];

    }

    update(data) {

        this.symbol = data.symbol || this.symbol;

        this.price = data.price || this.price;

        this.timestamp = Date.now();

        this.nodes = data.nodes || [];

    }

    clear() {

        this.symbol = null;

        this.price = null;

        this.timestamp = null;

        this.nodes = [];

    }

}

export default HunterMarketState;