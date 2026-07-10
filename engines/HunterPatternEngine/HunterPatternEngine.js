/**
 * Hunter Pattern Engine
 * Version: 0.7.0
 *
 * Hunter Constitution:
 * Rule #1:
 * Hunter only evaluates patterns when price is
 * within two strikes of a major institutional node.
 *
 * Dynamic pattern confirmation is handled by the
 * individual pattern detectors.
 */

import NodeDeflectionDetector from "./NodeDeflectionDetector.js";
import ReverseRugDetector from "./ReverseRugDetector.js";

class HunterPatternEngine {

    constructor() {

        this.version = "0.7.0";

        this.nodeDeflectionDetector =
            new NodeDeflectionDetector();

        this.reverseRugDetector =
            new ReverseRugDetector();

        this.patternNames = [
            "Node Deflection",
            "Rug",
            "Reverse Rug",
            "Beach Ball",
            "Rainbow Road",
            "Whipsaw",
            "Pike Cloud Regime"
        ];

    }

    analyze(marketState, structure) {

        const spot = marketState?.spot ?? null;

        const majorNodes = this.getMajorNodes(structure);

        const nearbyMajorNodes =
            majorNodes
                .map(node => ({
                    ...node,
                    distanceFromSpot:
                        spot !== null
                            ? Math.abs(node.strike - spot)
                            : null
                }))
                .filter(node =>
                    node.distanceFromSpot !== null &&
                    node.distanceFromSpot <= 2
                )
                .sort(
                    (a, b) =>
                        a.distanceFromSpot -
                        b.distanceFromSpot
                );

        const primaryNode =
            nearbyMajorNodes[0] || null;

        const currentSnapshot = {

            spot,

            primaryNode

        };

        const previousSnapshot =
            marketState?.previousSnapshot ??
            null;

        const nodeDeflection =
            this.nodeDeflectionDetector.analyze(
                currentSnapshot,
                previousSnapshot
            );

        const reverseRug =
            this.reverseRugDetector.analyze(
                currentSnapshot,
                previousSnapshot
            );

        const locationEligible =
            primaryNode !== null;

        const requiredData = [];

        //---------------------------------------------------
        // Constitution Rule #1
        //---------------------------------------------------

        if (!locationEligible) {

            return {

                version: this.version,

                status: "INELIGIBLE",

                locationEligible: false,

                nearMajorNode: false,

                primaryNode: null,

                nearbyMajorNodes: [],

                detectedPatterns: [],

                candidatePatterns: [],

                reason:
                    "Price is not within two strikes of a major institutional node. Hunter does not trade midpoints.",

                requiredData

            };

        }

        //---------------------------------------------------
        // Waiting on additional history
        //---------------------------------------------------

        requiredData.push(
            "priceHistory",
            "nodeMagnitudeHistory",
            "nodeStrikeHistory"
        );

        //---------------------------------------------------
        // Candidate Patterns
        //---------------------------------------------------

        const candidatePatterns = [];

        if (nodeDeflection.stage !== "WAITING_FOR_HISTORY") {

        candidatePatterns.push({

            name: "Node Deflection",

            stage: nodeDeflection.stage,

            confidence: nodeDeflection.confidence,

            direction: nodeDeflection.direction,

            strike: primaryNode.strike,

            nodeRole: primaryNode.role,

            distanceFromSpot: primaryNode.distanceFromSpot,

            reason: nodeDeflection.reason

    });

}

        if (reverseRug.stage !== "WAITING_FOR_HISTORY") {

        candidatePatterns.push({

            name: "Reverse Rug",

            stage: reverseRug.stage,

            confidence: reverseRug.confidence,

            direction: reverseRug.direction,

            strike: primaryNode.strike,

            nodeRole: primaryNode.role,

            distanceFromSpot: primaryNode.distanceFromSpot,

            reason: reverseRug.reason

    });

}

        //---------------------------------------------------
        // Confirmed Pattern
        //---------------------------------------------------

        const detectedPatterns =
            nodeDeflection.confirmed

                ? {

    name: "Node Deflection",

    confidence:
        nodeDeflection.confidence,

    direction:
        nodeDeflection.direction,

    strike:
        primaryNode.strike,

    nodeRole:
        primaryNode.role,

    distanceFromSpot:
        primaryNode.distanceFromSpot,

    reason:
        nodeDeflection.reason

}

                : [];

        return {

            version: this.version,

            status:

                nodeDeflection.confirmed

                    ? "PATTERN_ACTIVE"

                    : "ELIGIBLE_WAITING_FOR_PATTERN_DATA",

            locationEligible: true,

            nearMajorNode: true,

            primaryNode,

            nearbyMajorNodes,

            detectedPatterns,

            candidatePatterns,

            reason:
                "Price is within two strikes of a major institutional node. Pattern evaluation is permitted.",

            requiredData

        };

    }

    getMajorNodes(structure) {

        const candidates = [

            {
                role: "King Gamma",
                node: structure?.kingGammaNode
            },

            {
                role: "Strongest Above",
                node: structure?.strongestNodeAboveSpot
            },

            {
                role: "Strongest Below",
                node: structure?.strongestNodeBelowSpot
            }

        ];

        const uniqueNodes =
            new Map();

        for (const candidate of candidates) {

            const node =
                candidate.node;

            if (
                !node ||
                typeof node.strike !== "number"
            ) {
                continue;
            }

            const existing =
                uniqueNodes.get(node.strike);

            if (!existing) {

                uniqueNodes.set(

                    node.strike,

                    {

                        ...node,

                        role: candidate.role

                    }

                );

                continue;

            }

            if (
                candidate.role ===
                "King Gamma"
            ) {

                uniqueNodes.set(

                    node.strike,

                    {

                        ...node,

                        role: candidate.role

                    }

                );

            }

        }

        return [
            ...uniqueNodes.values()
        ];

    }

}

export default HunterPatternEngine;