/**
 * Hunter Evidence
 * Version: 0.1.0
 *
 * Canonical evidence contract shared by Hunter engines.
 *
 * Responsibilities:
 * - Normalize engine outputs into one stable snapshot.
 * - Preserve source engine results without reinterpreting them.
 * - Track evidence availability and missing inputs.
 * - Provide the future Decision Engine with one input object.
 *
 * Non-responsibilities:
 * - Scoring setups.
 * - Assigning grades.
 * - Creating trade recommendations.
 */

class HunterEvidence {

    constructor({
        marketState = null,
        nodes = [],
        structure = null,
        evolution = null,
        patterns = null,
        relativeStrength = null,
        optionsFlow = null,
        darkPools = null,
        execution = null
    } = {}) {

        this.version = "0.1.0";

        this.identity = this.buildIdentity(marketState);

        this.location = this.buildLocation(
            marketState,
            structure,
            patterns
        );

        this.structure = this.buildStructure(structure);

        this.evolution = this.buildEvolution(evolution);

        this.pattern = this.buildPattern(patterns);

        this.relativeStrength = this.buildOptionalSection(
            relativeStrength,
            "Relative Strength Engine not connected."
        );

        this.optionsFlow = this.buildOptionalSection(
            optionsFlow,
            "Options Flow Engine not connected."
        );

        this.darkPools = this.buildOptionalSection(
            darkPools,
            "Dark Pool Engine not connected."
        );

        this.execution = this.buildOptionalSection(
            execution,
            "Execution Engine not connected."
        );

        this.sources = {
            nodes: Array.isArray(nodes) ? nodes : [],
            structure,
            evolution,
            patterns,
            relativeStrength,
            optionsFlow,
            darkPools,
            execution
        };

        this.completeness = this.buildCompleteness();

        this.createdAt = new Date().toISOString();

    }

    buildIdentity(marketState) {

        return {
            symbol: marketState?.symbol ?? null,
            spot: marketState?.spot ?? null,
            expirations: marketState?.expirations ?? [],
            marketDataUpdatedAt:
                marketState?.lastUpdated ?? null
        };

    }

    buildLocation(marketState, structure, patterns) {

        const nearestNode =
            structure?.nearestNode ?? null;

        const primaryNode =
            patterns?.primaryNode ?? null;

        return {
            eligible:
                patterns?.locationEligible === true,

            nearMajorNode:
                patterns?.nearMajorNode === true,

            spot:
                marketState?.spot ?? null,

            nearestNode,

            nearestDistance:
                Number.isFinite(structure?.nearestDistance)
                    ? structure.nearestDistance
                    : null,

            primaryNode,

            nearbyMajorNodes:
                patterns?.nearbyMajorNodes ?? [],

            reason:
                patterns?.reason ??
                "Location evidence unavailable."
        };

    }

    buildStructure(structure) {

        if (!structure) {

            return {
                available: false,
                reason: "Institutional Structure Engine output unavailable."
            };

        }

        return {
            available: true,

            evaluation:
                structure.evaluation ?? null,

            kingGammaNode:
                structure.kingGammaNode ?? null,

            kingVannaNode:
                structure.kingVannaNode ?? null,

            strongestNodeAboveSpot:
                structure.strongestNodeAboveSpot ?? null,

            strongestNodeBelowSpot:
                structure.strongestNodeBelowSpot ?? null,

            nearestFloor:
                structure.nearestFloor ?? null,

            nearestCeiling:
                structure.nearestCeiling ?? null,

            nearestGatekeeper:
                structure.nearestGatekeeper ?? null,

            nearbyNodeCount:
                structure.nearbyNodes?.length ?? 0,

            floorCount:
                structure.floors?.length ?? 0,

            ceilingCount:
                structure.ceilings?.length ?? 0,

            gatekeeperCount:
                structure.gatekeepers?.length ?? 0
        };

    }

    buildEvolution(evolution) {

        if (!evolution) {

            return {
                available: false,
                hasHistory: false,
                nodeChanges: [],
                reason: "Institutional evolution evidence unavailable."
            };

        }

        return {
            available: true,
            hasHistory: evolution.hasHistory === true,
            nodeChanges: evolution.nodeChanges ?? [],
            reason:
                evolution.hasHistory === true
                    ? null
                    : "A prior snapshot is required for evolution evidence."
        };

    }

    buildPattern(patterns) {

        if (!patterns) {

            return {
                available: false,
                status: "UNAVAILABLE",
                detectedPatterns: [],
                candidatePatterns: [],
                requiredData: [],
                reason: "Hunter Pattern Engine output unavailable."
            };

        }

        return {
            available: true,
            status: patterns.status ?? "UNKNOWN",
            detectedPatterns: patterns.detectedPatterns ?? [],
            candidatePatterns: patterns.candidatePatterns ?? [],
            requiredData: patterns.requiredData ?? [],
            reason: patterns.reason ?? null
        };

    }

    buildOptionalSection(value, unavailableReason) {

        if (value === null || value === undefined) {

            return {
                available: false,
                reason: unavailableReason,
                data: null
            };

        }

        return {
            available: true,
            reason: null,
            data: value
        };

    }

    buildCompleteness() {

        const sections = {
            location:
                this.location.nearestNode !== null,

            structure:
                this.structure.available === true,

            evolution:
                this.evolution.available === true &&
                this.evolution.hasHistory === true,

            pattern:
                this.pattern.available === true,

            relativeStrength:
                this.relativeStrength.available === true,

            optionsFlow:
                this.optionsFlow.available === true,

            darkPools:
                this.darkPools.available === true,

            execution:
                this.execution.available === true
        };

        const availableCount =
            Object.values(sections)
                .filter(Boolean)
                .length;

        const totalCount =
            Object.keys(sections).length;

        return {
            sections,
            availableCount,
            totalCount,
            percent:
                Math.round(
                    (availableCount / totalCount) * 100
                ),
            missing:
                Object.entries(sections)
                    .filter(([, available]) => !available)
                    .map(([name]) => name)
        };

    }

    toJSON() {

        return {
            version: this.version,
            identity: this.identity,
            location: this.location,
            structure: this.structure,
            evolution: this.evolution,
            pattern: this.pattern,
            relativeStrength: this.relativeStrength,
            optionsFlow: this.optionsFlow,
            darkPools: this.darkPools,
            execution: this.execution,
            completeness: this.completeness,
            sources: this.sources,
            createdAt: this.createdAt
        };

    }

}

export default HunterEvidence;