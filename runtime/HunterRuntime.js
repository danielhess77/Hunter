/**
 * Hunter Runtime
 * Version: 1.2.0
 *
 * Central analysis pipeline for Hunter.
 *
 * Responsibilities:
 * - Orchestrate the production analysis pipeline.
 * - Stop immediately when canonical market data is invalid.
 * - Report stage-level runtime diagnostics.
 * - Preserve existing engine contracts during migration.
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

    constructor(config = {}) {

        this.version = "1.2.0";

        this.config = {
            diagnostics: true,
            ...config
        };

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

        this.evolutionEngine =
            new InstitutionalEvolutionEngine();

        this.patternEngine =
            new HunterPatternEngine();

        this.optionsFlowEngine =
            new HunterOptionsFlowEngine();

        this.decisionEngine =
            new HunterDecisionEngine();

    }

    analyze(rawData) {

        const startedAt =
            Date.now();

        const runtimeStatus =
            this.createRuntimeStatus();

        const previousSnapshot =
            this.memory.getCurrent();

        try {

            this.dataConnector.connect(
                rawData,
                this.marketState
            );

            runtimeStatus.connector =
                "OK";

            runtimeStatus.marketState =
                this.marketState.valid
                    ? "OK"
                    : "DATA_ERROR";

            runtimeStatus.marketStateSummary =
                typeof this.marketState.getSummary ===
                "function"
                    ? this.marketState.getSummary()
                    : this.buildFallbackSummary(
                        this.marketState
                    );

            this.logDiagnostics(
                "Connector + MarketState",
                runtimeStatus.marketStateSummary
            );

            if (!this.marketState.valid) {

                runtimeStatus.completed =
                    false;

                runtimeStatus.failedStage =
                    "MARKET_STATE";

                runtimeStatus.durationMs =
                    Date.now() - startedAt;

                return this.buildDataErrorResult({
                    runtimeStatus,
                    previousSnapshot,
                    reason:
                        this.marketState.reason ??
                        "MarketState validation failed."
                });

            }

            const nodes =
                this.mapEngine.analyze(
                    this.marketState
                );

            runtimeStatus.map =
                "OK";

            runtimeStatus.nodeCount =
                this.resolveNodeCount(nodes);

            const structure =
                this.structureEngine.analyze(
                    nodes,
                    this.marketState.currentSpot,
                    previousSnapshot?.nodes || []
                );

            runtimeStatus.structure =
                "OK";

            /*
             * Evolution currently remains sourced from the
             * Structure Engine for backward compatibility.
             *
             * A future production update will promote the
             * InstitutionalEvolutionEngine into its own explicit
             * runtime stage.
             */
            const evolution =
                structure?.evolution ??
                {
                    available: false,
                    reason:
                        "Evolution evidence was not supplied by the Structure Engine."
                };

            runtimeStatus.evolution =
                evolution?.available === false
                    ? "UNAVAILABLE"
                    : "OK";

            this.marketState.previousSnapshot =
                previousSnapshot;

            const patterns =
                this.patternEngine.analyze(
                    this.marketState,
                    structure
                );

            runtimeStatus.patterns =
                "OK";

            /*
             * Options-flow source priority:
             * 1. marketState.optionsFlow populated by the connector
             * 2. rawData.optionsFlow
             * 3. rawData.flow
             * 4. rawData.optionsTrades
             *
             * If none exist, the Options Flow Engine returns
             * unavailable evidence and Hunter continues.
             */
            const flowInput =
                this.hasUsableArray(
                    this.marketState.optionsFlow
                )
                    ? this.marketState.optionsFlow
                    : rawData?.optionsFlow ??
                      rawData?.flow ??
                      rawData?.optionsTrades ??
                      null;

            const optionsFlow =
                this.optionsFlowEngine.analyze(
                    flowInput,
                    {
                        symbol:
                            this.marketState.symbol,

                        spot:
                            this.marketState.currentSpot,

                        nodes,

                        structure,

                        patterns,

                        mode:
                            rawData?.mode ??
                            this.marketState.metadata?.mode ??
                            "SWING",

                        now:
                            this.marketState.lastUpdated ??
                            rawData?.timestamp ??
                            null
                    }
                );

            runtimeStatus.optionsFlow =
                optionsFlow?.available === false
                    ? "UNAVAILABLE"
                    : "OK";

            const evidence =
                new HunterEvidence({
                    marketState:
                        this.marketState,

                    nodes,

                    structure,

                    evolution,

                    patterns,

                    optionsFlow
                });

            runtimeStatus.evidence =
                "OK";

            const decision =
                this.decisionEngine.analyze(
                    evidence
                );

            runtimeStatus.decision =
                "OK";

            const memorySnapshot = {
                timestamp:
                    Date.now(),

                symbol:
                    this.marketState.symbol,

                spot:
                    this.marketState.currentSpot,

                currentSpot:
                    this.marketState.currentSpot,

                nodes,

                structure,

                evolution,

                patterns,

                optionsFlow,

                decision
            };

            this.memory.update(
                memorySnapshot
            );

            runtimeStatus.memory =
                "OK";

            runtimeStatus.completed =
                true;

            runtimeStatus.failedStage =
                null;

            runtimeStatus.durationMs =
                Date.now() - startedAt;

            this.logDiagnostics(
                "Analysis Complete",
                runtimeStatus
            );

            return {
                runtime:
                    runtimeStatus,

                marketState:
                    this.marketState,

                memory:
                    this.memory,

                nodes,

                structure,

                evolution,

                patterns,

                optionsFlow,

                evidence,

                decision
            };

        } catch (error) {

            runtimeStatus.completed =
                false;

            runtimeStatus.failedStage =
                this.findFailedStage(
                    runtimeStatus
                );

            runtimeStatus.error = {
                name:
                    error?.name ??
                    "Error",

                message:
                    error?.message ??
                    String(error)
            };

            runtimeStatus.durationMs =
                Date.now() - startedAt;

            this.logDiagnostics(
                "Runtime Failure",
                runtimeStatus,
                true
            );

            return {
                runtime:
                    runtimeStatus,

                marketState:
                    this.marketState,

                memory:
                    this.memory,

                error: {
                    type:
                        "RUNTIME_ERROR",

                    stage:
                        runtimeStatus.failedStage,

                    reason:
                        runtimeStatus.error.message
                }
            };

        }

    }

    createRuntimeStatus() {

        return {
            version:
                this.version,

            connector:
                "PENDING",

            marketState:
                "PENDING",

            map:
                "PENDING",

            structure:
                "PENDING",

            evolution:
                "PENDING",

            patterns:
                "PENDING",

            optionsFlow:
                "PENDING",

            evidence:
                "PENDING",

            decision:
                "PENDING",

            memory:
                "PENDING",

            completed:
                false,

            failedStage:
                null,

            nodeCount:
                0,

            marketStateSummary:
                null,

            error:
                null,

            durationMs:
                null
        };

    }

    buildDataErrorResult({
        runtimeStatus,
        previousSnapshot,
        reason
    }) {

        return {
            runtime:
                runtimeStatus,

            marketState:
                this.marketState,

            memory:
                this.memory,

            previousSnapshot:
                previousSnapshot ??
                null,

            error: {
                type:
                    "DATA_ERROR",

                stage:
                    "MARKET_STATE",

                reason
            }
        };

    }

    buildFallbackSummary(
        marketState
    ) {

        return {
            valid:
                marketState?.valid === true,

            reason:
                marketState?.reason ??
                null,

            symbol:
                marketState?.symbol ??
                null,

            currentSpot:
                marketState?.currentSpot ??
                marketState?.spot ??
                null,

            strikeCount:
                Array.isArray(
                    marketState?.strikes
                )
                    ? marketState.strikes.length
                    : 0,

            expirationCount:
                Array.isArray(
                    marketState?.expirations
                )
                    ? marketState.expirations.length
                    : 0,

            nodeCount:
                Array.isArray(
                    marketState?.nodes
                )
                    ? marketState.nodes.length
                    : 0
        };

    }

    resolveNodeCount(nodes) {

        if (Array.isArray(nodes)) {
            return nodes.length;
        }

        if (
            Array.isArray(
                nodes?.nodes
            )
        ) {
            return nodes.nodes.length;
        }

        return 0;

    }

    hasUsableArray(value) {

        return (
            Array.isArray(value) &&
            value.length > 0
        );

    }

    findFailedStage(
        runtimeStatus
    ) {

        const stageOrder = [
            "connector",
            "marketState",
            "map",
            "structure",
            "evolution",
            "patterns",
            "optionsFlow",
            "evidence",
            "decision",
            "memory"
        ];

        const failed =
            stageOrder.find(
                stage =>
                    runtimeStatus[stage] ===
                    "PENDING"
            );

        return failed
            ? failed.toUpperCase()
            : "UNKNOWN";

    }

    logDiagnostics(
        label,
        payload,
        isError = false
    ) {

        if (!this.config.diagnostics) {
            return;
        }

        const method =
            isError
                ? "error"
                : "log";

        console[method](
            `[Hunter Runtime v${this.version}] ${label}`,
            payload
        );

    }

}

export default HunterRuntime;