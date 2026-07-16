/**
 * Hunter Runtime
 * Version: 1.1.0
 *
 * Central analysis pipeline for Hunter.
 */

import HunterMarketState from "./HunterMarketState.js";
import HunterMemory from "./HunterMemory.js";
import HunterEvidence from "../shared/HunterEvidence.js";

import HunterDataConnector
    from "../connectors/HunterDataConnector/HunterDataConnector.js";

import InstitutionalMapEngine
    from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";

import InstitutionalStructureEngine
    from "../engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js";

import InstitutionalEvolutionEngine
    from "../engines/InstitutionalEvolutionEngine/InstitutionalEvolutionEngine.js";

import HunterPatternEngine
    from "../engines/HunterPatternEngine/HunterPatternEngine.js";

import HunterOptionsFlowEngine
    from "../engines/HunterOptionsFlowEngine/HunterOptionsFlowEngine.js";

import HunterDecisionEngine
    from "../engines/HunterDecisionEngine/HunterDecisionEngine.js";

class HunterRuntime {

    constructor() {

        this.dataConnector = new HunterDataConnector();
        this.marketState = new HunterMarketState();
        this.memory = new HunterMemory();

        this.mapEngine = new InstitutionalMapEngine();
        this.structureEngine = new InstitutionalStructureEngine();
        this.evolutionEngine = new InstitutionalEvolutionEngine();
        this.patternEngine = new HunterPatternEngine();
        this.optionsFlowEngine = new HunterOptionsFlowEngine();
        this.decisionEngine = new HunterDecisionEngine();

    }

    analyze(rawData) {

        const previousSnapshot =
            this.memory.getCurrent();

        this.dataConnector.connect(
            rawData,
            this.marketState
        );

        const nodes =
            this.mapEngine.analyze(
                this.marketState
            );

        const structure =
            this.structureEngine.analyze(
                nodes,
                this.marketState.spot,
                previousSnapshot?.nodes || []
            );

        const evolution =
            structure.evolution;

        this.marketState.previousSnapshot =
            previousSnapshot;

        const patterns =
            this.patternEngine.analyze(
                this.marketState,
                structure
            );

        /*
         * Options-flow source priority:
         * 1. marketState.optionsFlow populated by the connector
         * 2. rawData.optionsFlow
         * 3. rawData.flow
         * 4. rawData.optionsTrades
         *
         * If none exist, the engine returns unavailable evidence
         * and Hunter continues normally.
         */
        const flowInput =
            this.marketState.optionsFlow ??
            rawData?.optionsFlow ??
            rawData?.flow ??
            rawData?.optionsTrades ??
            null;

        const optionsFlow =
            this.optionsFlowEngine.analyze(
                flowInput,
                {
                    symbol: this.marketState.symbol,
                    spot: this.marketState.spot,
                    nodes,
                    structure,
                    patterns,
                    mode:
                        rawData?.mode ??
                        this.marketState.mode ??
                        "SWING",
                    now:
                        this.marketState.lastUpdated ??
                        rawData?.timestamp ??
                        null
                }
            );

        const evidence = new HunterEvidence({
            marketState: this.marketState,
            nodes,
            structure,
            evolution,
            patterns,
            optionsFlow
        });

        const decision =
            this.decisionEngine.analyze(
                evidence
            );

        this.memory.update({
            timestamp: Date.now(),
            symbol: this.marketState.symbol,
            spot: this.marketState.spot,
            nodes,
            structure,
            patterns,
            optionsFlow,
            decision
        });

        return {
            marketState: this.marketState,
            memory: this.memory,
            nodes,
            structure,
            evolution,
            patterns,
            optionsFlow,
            evidence,
            decision
        };

    }

}

export default HunterRuntime;