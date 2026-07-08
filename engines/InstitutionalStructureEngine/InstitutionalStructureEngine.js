import StructureStateAnalyzer from "./StructureStateAnalyzer.js";

/**
 * Institutional Structure Engine
 * Version: 1.1
 *
 * Aggregates institutional nodes and prepares
 * structure-level intelligence.
 */

class InstitutionalStructureEngine {

    constructor() {

        this.stateAnalyzer = new StructureStateAnalyzer();

    }

    analyze(nodes = [], currentPrice = null, previousNodes = []) {

        const stateNodes =
            this.stateAnalyzer.analyze(nodes, previousNodes);

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

        return {

            nodes: stateNodes,

            kingNode: stateNodes.find(node => node.isKingNode),

            floors: stateNodes.filter(node => node.isFloor),

            ceilings: stateNodes.filter(node => node.isCeiling),

            gatekeepers: stateNodes.filter(node => node.isGatekeeper),

            nearestNode,

            nearestDistance,

            nearbyNodes

        };

    }

}

export default InstitutionalStructureEngine;