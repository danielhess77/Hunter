/**
 * Hunter Runtime
 * Version: 0.5.0
 *
 * Central analysis pipeline for Hunter.
 *
 * Every future engine should execute through
 * this runtime.
 */

import HunterMarketState from "./HunterMarketState.js";

import HunterDataConnector
    from "../connectors/HunterDataConnector/HunterDataConnector.js";

import InstitutionalMapEngine
    from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";

import InstitutionalStructureEngine
    from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";

class HunterRuntime {

    constructor() {

        this.dataConnector =
            new HunterDataConnector();

        this.marketState =
            new HunterMarketState();

        this.mapEngine =
            new InstitutionalMapEngine();

        this.structureEngine =
            new InstitutionalStructureEngine();

    }

    analyze(rawData) {

        //--------------------------------------------------
        // Build Market State
        //--------------------------------------------------

        this.dataConnector.connect(
            rawData,
            this.marketState
        );

        //--------------------------------------------------
        // Parse Institutional Nodes
        //--------------------------------------------------

        const nodes =
            this.mapEngine.analyze(
                this.marketState
            );

        //--------------------------------------------------
        // Build Institutional Structure
        //--------------------------------------------------

        const structure =
            this.structureEngine.analyze(

                nodes,

                this.marketState.spot

            );

        //--------------------------------------------------
        // Runtime Result
        //--------------------------------------------------

        return {

            marketState: this.marketState,

            nodes,

            structure

        };

    }

}

export default HunterRuntime;