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

import HunterMemory from "./HunterMemory.js";

import HunterDataConnector
    from "../connectors/HunterDataConnector/HunterDataConnector.js";

import InstitutionalMapEngine
    from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";

import InstitutionalStructureEngine
    from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";

import HunterDecisionEngine
    from "../engines/HunterDecisionEngine/HunterDecisionEngine.js";

import HunterPatternEngine
    from "../engines/HunterPatternEngine/HunterPatternEngine.js";

class HunterRuntime {

    constructor() {

        this.dataConnector =
            new HunterDataConnector();

        this.marketState =
            new HunterMarketState();

        this.memory =
            new HunterMemory();

        this.mapEngine =
            new InstitutionalMapEngine();

        this.structureEngine =
            new InstitutionalStructureEngine();

        this.patternEngine =
            new HunterPatternEngine();

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
        // Update Runtime Memory
        //--------------------------------------------------

        this.memory.update({

        timestamp: Date.now(),

        symbol: this.marketState.symbol,

        spot: this.marketState.spot,

        structure

        });

        //--------------------------------------------------
        // Analyze Institutional Patterns
        //--------------------------------------------------

        const patterns =
            this.patternEngine.analyze(
                this.marketState,
                structure
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

        memory: this.memory,

        nodes,

        structure,

        patterns,

        decision

};

    }

}

export default HunterRuntime;