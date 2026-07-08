import StructureStateAnalyzer from "./StructureStateAnalyzer.js";

/**
 * Institutional Structure Engine
 * Version: 1.2
 *
 * Aggregates institutional nodes and identifies
 * key structural reference points.
 */

class InstitutionalStructureEngine {

    constructor() {

        this.stateAnalyzer = new StructureStateAnalyzer();

    }

    analyze(nodes = [], currentPrice = null, previousNodes = []) {

        const stateNodes =
            this.stateAnalyzer.analyze(nodes, currentPrice, previousNodes);

        let nearestNode = null;
        let nearestDistance = Number.MAX_VALUE;

        if (currentPrice !== null) {

            for (const node of stateNodes) {

                const distance = Math.abs(node.strike - currentPrice);

                if (distance < nearestDistance) {

                    nearestDistance = distance;
                    nearestNode = node;

                }

            }

        }

        const nearbyNodes = stateNodes.filter(node =>
            currentPrice !== null &&
            Math.abs(node.strike - currentPrice) <= 2
        );

        const kingNode = stateNodes.reduce(
            (largest, current) =>
                !largest || current.magnitude > largest.magnitude
                    ? current
                    : largest,
            null
        );

        const floors = stateNodes.filter(node => node.isFloor);

        const ceilings = stateNodes.filter(node => node.isCeiling);

        const gatekeepers = stateNodes.filter(node => node.isGatekeeper);

        const nearestFloor =
            floors.sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        const nearestCeiling =
            ceilings.sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        const nearestGatekeeper =
            gatekeepers.sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        return {

            nodes: stateNodes,

            kingNode,

            nearestFloor,

            nearestCeiling,

            nearestGatekeeper,

            floors,

            ceilings,

            gatekeepers,

            nearestNode,

            nearestDistance,

            nearbyNodes

        };

    }

}

export default InstitutionalStructureEngine;