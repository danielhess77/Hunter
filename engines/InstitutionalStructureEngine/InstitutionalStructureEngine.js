import StructureStateAnalyzer from "./StructureStateAnalyzer.js";
import StructureEvaluator from "./StructureEvaluator.js";

/**
 * Hunter Institutional Structure Engine
 * Version 1.4
 *
 * Responsible for turning institutional nodes into
 * a complete market structure snapshot.
 *
 * King Node = Largest Gamma Magnitude
 */

class InstitutionalStructureEngine {

    constructor() {

        this.stateAnalyzer = new StructureStateAnalyzer();
        this.structureEvaluator = new StructureEvaluator();

    }

    analyze(nodes = [], currentPrice = null, previousNodes = []) {

        //----------------------------------------------------
        // Analyze node state
        //----------------------------------------------------

        const stateNodes =
            this.stateAnalyzer.analyze(
                nodes,
                currentPrice,
                previousNodes
            );

        //----------------------------------------------------
        // Nearest node
        //----------------------------------------------------

        let nearestNode = null;
        let nearestDistance = Number.MAX_VALUE;

        if (currentPrice !== null) {

            stateNodes.forEach(node => {

                const distance =
                    Math.abs(node.strike - currentPrice);

                if (distance < nearestDistance) {

                    nearestDistance = distance;
                    nearestNode = node;

                }

            });

        }

        const nearbyNodes = stateNodes.filter(node =>
            currentPrice !== null &&
            Math.abs(node.strike - currentPrice) <= 2
        );

        //----------------------------------------------------
        // King Nodes
        //----------------------------------------------------

        const kingGammaNode =
            [...stateNodes].sort(
                (a, b) =>
                    b.gammaMagnitude - a.gammaMagnitude
            )[0] || null;

        const kingVannaNode =
            [...stateNodes].sort(
                (a, b) =>
                    b.vannaMagnitude - a.vannaMagnitude
            )[0] || null;

        //----------------------------------------------------
        // Strongest Above / Below
        //----------------------------------------------------

        const strongestNodeAboveSpot =
            stateNodes
                .filter(node =>
                    currentPrice !== null &&
                    node.strike > currentPrice
                )
                .sort(
                    (a, b) =>
                        b.gammaMagnitude - a.gammaMagnitude
                )[0] || null;

        const strongestNodeBelowSpot =
            stateNodes
                .filter(node =>
                    currentPrice !== null &&
                    node.strike < currentPrice
                )
                .sort(
                    (a, b) =>
                        b.gammaMagnitude - a.gammaMagnitude
                )[0] || null;

        //----------------------------------------------------
        // Classified nodes
        //----------------------------------------------------

        const floors =
            stateNodes.filter(node => node.isFloor);

        const ceilings =
            stateNodes.filter(node => node.isCeiling);

        const gatekeepers =
            stateNodes.filter(node => node.isGatekeeper);

        const nearestFloor =
            [...floors]
                .sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        const nearestCeiling =
            [...ceilings]
                .sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        const nearestGatekeeper =
            [...gatekeepers]
                .sort((a, b) => a.absDistance - b.absDistance)[0] || null;

        //----------------------------------------------------
        // Build Structure Object
        //----------------------------------------------------

        const structure = {

            nodes: stateNodes,

            kingNode: kingGammaNode,

            kingGammaNode,

            kingVannaNode,

            strongestNodeAboveSpot,

            strongestNodeBelowSpot,

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

        //----------------------------------------------------
        // Evaluate Structure
        //----------------------------------------------------

        structure.evaluation =
            this.structureEvaluator.evaluate(structure);

        return structure;

    }

}

export default InstitutionalStructureEngine;