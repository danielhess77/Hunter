/**
 * Hunter Runtime
 * Version: 0.6.0
 *
 * Central analysis pipeline for Hunter.
 *
 * Every future engine executes
 * through this runtime.
 */

import HunterMarketState from "./HunterMarketState.js";

import HunterDataConnector
    from "../connectors/HunterDataConnector/HunterDataConnector.js";

import InstitutionalMapEngine
    from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";

import InstitutionalStructureEngine
    from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";

import HunterDecisionEngine
    from "../engines/HunterDecisionEngine/HunterDecisionEngine.js";

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

        this.decisionEngine =
            new HunterDecisionEngine();

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
        // Analyze Institutional Structure
        //--------------------------------------------------

        const structure =
            this.structureEngine.analyze(
                nodes,
                this.marketState.spot
            );

        //--------------------------------------------------
        // Institutional Decision
        //--------------------------------------------------

        const decision =
            this.decisionEngine.analyze(
                structure
            );

        //--------------------------------------------------
        // Runtime Result
        //--------------------------------------------------

        return {

            marketState: this.marketState,

            nodes,

            structure,

            decision

        };

    }

}

export default HunterRuntime;