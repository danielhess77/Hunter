/**
 * Hunter Market State
 * Version: 1.0
 *
 * Stores the current state of the market.
 */

class HunterMarketState {

    constructor() {

        this.symbol = null;

        this.price = null;

        this.structure = null;

        this.nodes = [];

        this.pattern = null;

        this.relativeStrength = null;

    }

    update(data) {

        Object.assign(this, data);

    }

}

export default HunterMarketState;