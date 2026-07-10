/**
 * Hunter Runtime
 * Version: 0.8.0
 *
 * Central analysis pipeline for Hunter.
 */

import HunterMarketState from "./HunterMarketState.js";
import HunterMemory from "./HunterMemory.js";

import HunterDataConnector
    from "../connectors/HunterDataConnector/HunterDataConnector.js";

import InstitutionalMapEngine
    from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";

import InstitutionalStructureEngine
    from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";

import InstitutionalEvolutionEngine
    from "../engines/InstitutionalEvolutionEngine/InstitutionalEvolutionEngine.js";

import HunterDecisionEngine
    from "../engines/HunterDecisionEngine/HunterDecisionEngine.js";

import HunterPatternEngine
    from "../engines/HunterPatternEngine/HunterPatternEngine.js";

class HunterRuntime {

    constructor() {

        this.dataConnector = new HunterDataConnector();

        this.marketState = new HunterMarketState();

        this.memory = new HunterMemory();

        this.mapEngine = new InstitutionalMapEngine();

        this.structureEngine = new InstitutionalStructureEngine();

        this.evolutionEngine = new InstitutionalEvolutionEngine();

        this.patternEngine = new HunterPatternEngine();

        this.decisionEngine = new HunterDecisionEngine();

    }

    analyze(rawData) {

        //--------------------------------------------------
        // Capture previous snapshot BEFORE anything changes
        //--------------------------------------------------

        const previousSnapshot =
            this.memory.getCurrent();

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
        // Analyze Institutional Evolution
        //--------------------------------------------------

        const evolution =
            this.evolutionEngine.analyze(
                nodes,
                previousSnapshot?.nodes
            );

        //--------------------------------------------------
        // Make history available to Pattern Engine
        //--------------------------------------------------

        this.marketState.previousSnapshot =
            previousSnapshot;

        //--------------------------------------------------
        // Analyze Patterns
        //--------------------------------------------------

        const patterns =
            this.patternEngine.analyze(
                this.marketState,
                structure
            );

        //--------------------------------------------------
        // Decision Engine
        //--------------------------------------------------

        const decision =
            this.decisionEngine.analyze(
                structure
            );

        //--------------------------------------------------
        // NOW update memory
        //--------------------------------------------------

        this.memory.update({

            timestamp: Date.now(),

            symbol: this.marketState.symbol,

            spot: this.marketState.spot,

            nodes,

            structure

        });

        //--------------------------------------------------
        // Return Result
        //--------------------------------------------------

        return {

            marketState: this.marketState,

            memory: this.memory,

            nodes,

            structure,

            evolution,

            patterns,

            decision

        };

    }

}

export default HunterRuntime;